// DAPUR KILAT — orders.js
// Order tickets: what the customers want, how long the cook has, and what a
// good or bad serve is worth. Pressure grows over the shift: orders arrive
// faster and their timers get shorter.

import { RECIPES } from './recipes.js';

export const SHIFT_SECONDS = 180; // one full shift
export const MAX_TICKETS = 4;

let nextTicketId = 1;

export function makeTicket(elapsed, rng) {
  const recipe = RECIPES[Math.floor(rng() * RECIPES.length)];
  // Timers shrink as the shift goes on: 70s early, 45s late.
  const pressure = Math.min(1, elapsed / SHIFT_SECONDS);
  const total = 70 - 25 * pressure;
  return {
    id: nextTicketId++,
    recipe,
    total,
    left: total,
    warned: false, // tick sound already played under 10s
  };
}

export function makeOrderBoard(rng) {
  return {
    tickets: [],
    spawnIn: 1.5, // first order arrives almost at once
    served: 0,
    expired: 0,
    wrong: 0,
    score: 0,
    combo: 0,
    bestCombo: 0,
    earned: 0,

    update(dt, elapsed) {
      let event = null;
      this.spawnIn -= dt;
      if (this.spawnIn <= 0 && this.tickets.length < MAX_TICKETS) {
        this.tickets.push(makeTicket(elapsed, rng));
        // Next order comes sooner as the shift heats up.
        const pressure = Math.min(1, elapsed / SHIFT_SECONDS);
        this.spawnIn = 14 - 7 * pressure;
        event = 'new-order';
      }
      for (const t of this.tickets) {
        t.left -= dt;
        if (t.left <= 10 && !t.warned) {
          t.warned = true;
          event = event || 'ticket-low';
        }
      }
      const before = this.tickets.length;
      this.tickets = this.tickets.filter((t) => {
        if (t.left > 0) return true;
        this.expired++;
        this.combo = 0;
        return false;
      });
      if (this.tickets.length < before && event !== 'ticket-low') event = 'expired';
      else if (this.tickets.length < before) event = 'expired';
      return event;
    },

    // Serve a finished plate. Returns { ok, points, recipe } or { ok: false }.
    serve(recipe) {
      const idx = this.tickets.findIndex((t) => t.recipe.id === recipe.id);
      if (idx === -1) {
        this.wrong++;
        this.combo = 0;
        this.score = Math.max(0, this.score - 50);
        return { ok: false };
      }
      const ticket = this.tickets[idx];
      this.tickets.splice(idx, 1);
      this.served++;
      this.combo++;
      this.bestCombo = Math.max(this.bestCombo, this.combo);
      // Fast serves pay more: up to +50% when half the time is still left.
      const speedBonus = Math.round(recipe.price * 0.5 * (ticket.left / ticket.total));
      const comboBonus = (this.combo - 1) * 10;
      const points = recipe.price + speedBonus + comboBonus;
      this.score += points;
      this.earned += points;
      return { ok: true, points, recipe, combo: this.combo };
    },

    reset() {
      this.tickets = [];
      this.spawnIn = 1.5;
      this.served = 0;
      this.expired = 0;
      this.wrong = 0;
      this.score = 0;
      this.combo = 0;
      this.bestCombo = 0;
      this.earned = 0;
      nextTicketId = 1;
    },
  };
}
