import assert from "node:assert/strict";
import { test } from "node:test";

import { stripHtml } from "../lib/text.ts";

test("remove tags HTML", () => {
  assert.equal(
    stripHtml("<p><b>Breaking Bad</b> follows a <i>teacher</i>.</p>"),
    "Breaking Bad follows a teacher.",
  );
});

test("transforma fim de parágrafo e <br> em quebra de linha", () => {
  assert.equal(stripHtml("<p>Um</p><p>Dois<br/>Três</p>"), "Um\nDois\nTrês");
});

test("decodifica entidades HTML", () => {
  assert.equal(stripHtml("Tom &amp; Jerry&#39;s &quot;show&quot; &#x41;"), "Tom & Jerry's \"show\" A");
});

test("devolve null para sinopse ausente ou vazia", () => {
  assert.equal(stripHtml(null), null);
  assert.equal(stripHtml(undefined), null);
  assert.equal(stripHtml(""), null);
  assert.equal(stripHtml("<p> </p>"), null);
});
