import assert from "node:assert/strict";
import { test } from "node:test";

import { formatDate, formatMinutes, formatShowStatus } from "../lib/format.ts";

test("formatMinutes mostra sempre a unidade e converte para horas a partir de 60", () => {
  assert.equal(formatMinutes(45), "45 min");
  assert.equal(formatMinutes(60), "60 min (1 h)");
  assert.equal(formatMinutes(420), "420 min (7 h)");
  assert.equal(formatMinutes(125), "125 min (2 h 5 min)");
});

test("formatDate converte AAAA-MM-DD para DD/MM/AAAA sem mudar o dia", () => {
  assert.equal(formatDate("2008-01-20"), "20/01/2008");
  assert.equal(formatDate("2026-12-31"), "31/12/2026");
  assert.equal(formatDate(null), null);
});

test("formatShowStatus traduz as situações conhecidas", () => {
  assert.equal(formatShowStatus("Ended"), "Encerrada");
  assert.equal(formatShowStatus("Running"), "Em exibição");
  assert.equal(formatShowStatus("Outro valor"), "Outro valor");
  assert.equal(formatShowStatus(null), null);
});
