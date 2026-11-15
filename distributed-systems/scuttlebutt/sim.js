// Anti-entropy simulation for the Scuttlebutt explainer.
// Implements the model and the four reconciliation orderings from
// van Renesse et al., "Efficient Reconciliation and Flow Control for
// Anti-Entropy Protocols" (LADIS 2008), plus its flow-control scheme.

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STRATEGIES = ['scuttle-depth', 'scuttle-breadth', 'precise-newest', 'precise-oldest'];

// Flow-control parameters used in the paper's experiments.
const FLOW = { phi1: 3, phi2: 3, alpha: 0.75, beta: 0.2 };

class Cluster {
  constructor({ n = 32, keys = 16, mtu = 24, strategy = 'scuttle-depth', seed = 1, flow = false }) {
    Object.assign(this, { n, K: keys, mtu, strategy, flow, time: 0 });
    // ver[q][p*K + k]: the version participant q holds for participant p's key k.
    this.ver = Array.from({ length: n }, () => new Int32Array(n * keys));
    // maxv[q][p]: the highest version q holds for any of p's keys (the digest entry).
    this.maxv = Array.from({ length: n }, () => new Int32Array(n));
    // For staleness: when each version was created, and each key's version history.
    this.verTime = Array.from({ length: n }, () => [0]);
    this.keyVers = Array.from({ length: n }, () => Array.from({ length: keys }, () => [0]));
    this.updRng = mulberry32(seed);
    this.gossipRng = mulberry32(seed * 7919 + 1);
    this.orderRng = mulberry32(seed * 104729 + 2);
    this.credit = Array.from({ length: n }, () => this.updRng());
    this.desired = 1;                       // desired updates per participant per round
    this.tau = new Float64Array(n).fill(1); // flow control: max update rate
    this.overRun = new Int32Array(n);
    this.underRun = new Int32Array(n);
    this.lastOverflows = 0;
    this.lastUpdates = 0;
  }

  update(p, k) {
    const v = this.maxv[p][p] + 1;          // higher than any version p used before
    this.ver[p][p * this.K + k] = v;
    this.maxv[p][p] = v;
    this.verTime[p][v] = this.time;
    this.keyVers[p][k].push(v);
  }

  deltas(from, to) {
    const out = [], K = this.K, a = this.ver[from], b = this.ver[to], mt = this.maxv[to];
    const precise = this.strategy.startsWith('precise');
    for (let r = 0; r < this.n; r++) {
      if (!precise && this.maxv[from][r] <= mt[r]) continue;
      for (let k = 0; k < K; k++) {
        const v = a[r * K + k];
        if (precise ? v > b[r * K + k] : v > mt[r]) out.push({ r, k, v });
      }
    }
    return out;
  }

  order(ds) {
    const rnd = this.orderRng, perm = new Float64Array(this.n);
    for (let i = 0; i < this.n; i++) perm[i] = rnd();   // fresh random participant order per message
    const s = this.strategy;
    if (s === 'precise-newest' || s === 'precise-oldest') {
      const sign = s === 'precise-newest' ? -1 : 1;
      return ds.sort((x, y) =>
        sign * (this.verTime[x.r][x.v] - this.verTime[y.r][y.v]) || perm[x.r] - perm[y.r] || x.v - y.v);
    }
    const groups = new Map();
    for (const d of ds) (groups.get(d.r) || groups.set(d.r, []).get(d.r)).push(d);
    for (const g of groups.values()) g.sort((x, y) => x.v - y.v);   // per participant: version order
    if (s === 'scuttle-depth') {
      // Participants with the most available deltas first; ties broken randomly.
      return [...groups.entries()]
        .sort(([ra, ga], [rb, gb]) => gb.length - ga.length || perm[ra] - perm[rb])
        .flatMap(([, g]) => g);
    }
    // scuttle-breadth: by rank within participant, then random participant order.
    const ranked = [];
    for (const g of groups.values()) g.forEach((d, i) => ranked.push([i, d]));
    return ranked.sort(([ia, a], [ib, b]) => ia - ib || perm[a.r] - perm[b.r]).map(([, d]) => d);
  }

  apply(to, ds) {
    const K = this.K, t = this.ver[to], m = this.maxv[to];
    for (const { r, k, v } of ds) {
      if (v > t[r * K + k]) t[r * K + k] = v;
      if (v > m[r]) m[r] = v;
    }
  }

  exchange(p, q) {
    const dpq = this.deltas(p, q), dqp = this.deltas(q, p);
    const overflow = dpq.length > this.mtu || dqp.length > this.mtu;
    const under = dpq.length < this.mtu && dqp.length < this.mtu;
    this.apply(q, this.order(dpq).slice(0, this.mtu));
    this.apply(p, this.order(dqp).slice(0, this.mtu));
    if (overflow) this.lastOverflows++;
    if (this.flow) { this.split(p, q); this.aimd(p, overflow, under); this.aimd(q, overflow, under); }
    return { sent: [Math.min(dpq.length, this.mtu), Math.min(dqp.length, this.mtu)], wanted: [dpq.length, dqp.length] };
  }

  // Section 4.1: spread capacity fairly between the two gossiping participants.
  split(p, q) {
    const rp = this.desired, rq = this.desired, tp = this.tau[p], tq = this.tau[q], total = tp + tq, avg = total / 2;
    if (rp + rq <= total) { this.tau[p] = rp + (total - rp - rq) / 2; this.tau[q] = rq + (total - rp - rq) / 2; }
    else if (rp >= avg && rq >= avg) { this.tau[p] = avg; this.tau[q] = avg; }
    else if (rp < avg) { this.tau[p] = rp; this.tau[q] = total - rp; }
    else { this.tau[q] = rq; this.tau[p] = total - rq; }
  }

  // Section 4.2: AIMD on the maximum update rate.
  aimd(p, overflow, under) {
    if (overflow) {
      this.underRun[p] = 0;
      if (++this.overRun[p] >= FLOW.phi1) { this.tau[p] *= FLOW.alpha; this.overRun[p] = 0; }
    } else if (under) {
      this.overRun[p] = 0;
      if (++this.underRun[p] >= FLOW.phi2) { this.tau[p] = Math.min(this.tau[p] + FLOW.beta, this.mtu); this.underRun[p] = 0; }
    } else { this.overRun[p] = 0; this.underRun[p] = 0; }
  }

  tick() {
    this.time++;
    this.lastOverflows = 0; this.lastUpdates = 0;
    for (let p = 0; p < this.n; p++) {
      const rate = this.flow ? Math.min(this.desired, this.tau[p]) : this.desired;
      this.credit[p] += rate;
      while (this.credit[p] >= 1) {
        this.credit[p] -= 1;
        this.update(p, Math.floor(this.updRng() * this.K));
        this.lastUpdates++;
      }
    }
    for (let p = 0; p < this.n; p++) {
      let q = Math.floor(this.gossipRng() * (this.n - 1));
      if (q >= p) q++;
      this.exchange(p, q);
    }
  }

  metrics() {
    let stale = 0, maxStale = 0;
    const K = this.K;
    for (let p = 0; p < this.n; p++) {
      const own = this.ver[p];
      for (let q = 0; q < this.n; q++) {
        if (q === p) continue;
        const theirs = this.ver[q];
        for (let k = 0; k < K; k++) {
          const vq = theirs[p * K + k], vp = own[p * K + k];
          if (vq === vp) continue;
          stale++;
          // Out of date since the owner's first update to k after the version q holds.
          const hist = this.keyVers[p][k];
          let i = hist.length - 1;
          while (i > 0 && hist[i - 1] > vq) i--;
          const age = this.time - this.verTime[p][hist[i]];
          if (age > maxStale) maxStale = age;
        }
      }
    }
    let rate = 0;
    for (let p = 0; p < this.n; p++) rate += this.flow ? Math.min(this.desired, this.tau[p]) : this.desired;
    return { stale, maxStale, rate: rate / this.n };
  }
}

if (typeof module !== 'undefined') module.exports = { Cluster, STRATEGIES, FLOW, mulberry32 };
