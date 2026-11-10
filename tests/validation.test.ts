import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  parseCountryCode,
  parsePositiveId,
  parseScheduleDate,
  parseSearchQuery,
} from "../lib/validation.ts";

describe("parseSearchQuery", () => {
  test("remove espaços das pontas", () => {
    assert.deepEqual(parseSearchQuery("  girls  "), { ok: true, value: "girls" });
  });

  test("rejeita termo ausente, vazio ou só com espaços", () => {
    for (const raw of [null, "", "   "]) {
      assert.equal(parseSearchQuery(raw).ok, false);
    }
  });

  test("aceita até 100 caracteres e rejeita 101", () => {
    assert.equal(parseSearchQuery("a".repeat(100)).ok, true);
    assert.equal(parseSearchQuery("a".repeat(101)).ok, false);
  });
});

describe("parsePositiveId", () => {
  test("aceita inteiros positivos", () => {
    assert.deepEqual(parsePositiveId("169", "erro"), { ok: true, value: 169 });
  });

  test("rejeita valores que não são inteiros positivos", () => {
    for (const raw of ["abc", "0", "-1", "1.5", "007", "", "1e3", "99999999999999999999"]) {
      assert.deepEqual(parsePositiveId(raw, "erro"), { ok: false, error: "erro" }, raw);
    }
  });
});

describe("parseScheduleDate", () => {
  test("aceita datas existentes no calendário, inclusive 29/02 de ano bissexto", () => {
    for (const date of ["2026-11-22", "2024-02-29", "2000-02-29", "2026-12-31", "2026-01-01"]) {
      assert.deepEqual(parseScheduleDate(date), { ok: true, value: date });
    }
  });

  test("rejeita datas que não existem", () => {
    for (const date of ["2026-02-30", "2025-02-29", "1900-02-29", "2026-04-31", "2026-13-01", "2026-00-10", "2026-11-00", "2026-11-32"]) {
      assert.equal(parseScheduleDate(date).ok, false, date);
    }
  });

  test("rejeita formatos diferentes de AAAA-MM-DD", () => {
    for (const date of ["22/11/2026", "2026-1-5", "2026/11/22", "20261122", "2026-11-22T00:00", "hoje"]) {
      assert.equal(parseScheduleDate(date).ok, false, date);
    }
  });

  test("sem data, usa o dia atual no fuso de São Paulo (não o do servidor)", () => {
    // 02:59 UTC de 11/11 ainda é 23:59 de 10/11 em São Paulo (UTC-3).
    assert.deepEqual(parseScheduleDate(null, new Date("2026-11-11T02:59:00Z")), {
      ok: true,
      value: "2026-11-10",
    });
    assert.deepEqual(parseScheduleDate("", new Date("2026-11-11T03:00:00Z")), {
      ok: true,
      value: "2026-11-11",
    });
  });
});

describe("parseCountryCode", () => {
  test("usa BR quando o país não é informado", () => {
    assert.deepEqual(parseCountryCode(null), { ok: true, value: "BR" });
    assert.deepEqual(parseCountryCode(""), { ok: true, value: "BR" });
  });

  test("aceita duas letras e converte para maiúsculas", () => {
    assert.deepEqual(parseCountryCode("us"), { ok: true, value: "US" });
    assert.deepEqual(parseCountryCode(" gb "), { ok: true, value: "GB" });
  });

  test("rejeita códigos fora do formato", () => {
    for (const raw of ["B", "BRA", "B1", "12", "Brasil"]) {
      assert.equal(parseCountryCode(raw).ok, false, raw);
    }
  });
});
