import { LIBRARY_SCORES } from "../library";
import { scoreState } from "../state/score.svelte";
import { playbackState } from "../state/playback.svelte";
import { editorState } from "../state/editor.svelte";
import { unlockAudio } from "../audio/engine";
import * as persistence from "../services/persistence";
import type { ExportedScore, SavedScore } from "../services/persistence";

const MAX_IMPORT_SIZE_BYTES = 512 * 1024;

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function prepareAudio() {
  void unlockAudio();
}

export function setScoreTitle(title: string) {
  scoreState.setTitle(title);
  editorState.libraryName = title;
}

export function setTimeSignature(beats: number, subdivision: number) {
  scoreState.setTimeSignature(beats, subdivision);
  if (playbackState.isPlaying) {
    playbackState.stop();
    setTimeout(() => playbackState.start(), 50);
  }
}

export function loadLibraryScore(id: string) {
  const item = LIBRARY_SCORES.find((entry) => entry.id === id);
  if (item) scoreState.loadScore(item.score);
  editorState.selectedLibraryId = "";
  if (playbackState.isPlaying) {
    playbackState.stop();
    setTimeout(() => playbackState.start(), 50);
  }
}

export function saveCurrentScore() {
  if (!scoreState.value) return;
  const name = persistence.safeName(
    editorState.libraryName ||
      scoreState.value.title ||
      scoreState.value.genre ||
      "Levada",
  );
  const now = new Date().toISOString();
  const current = editorState.selectedSavedId
    ? editorState.savedScores.find(
        (item) => item.id === editorState.selectedSavedId,
      )
    : null;
  const savedScore: SavedScore = {
    id: current?.id ?? persistence.createId(),
    name,
    score: persistence.personalScore(scoreState.value, name),
    createdAt: current?.createdAt ?? now,
    updatedAt: now,
    formatVersion: persistence.SCORE_FORMAT_VERSION,
  };
  const nextScores = [
    savedScore,
    ...editorState.savedScores.filter((item) => item.id !== savedScore.id),
  ];
  editorState.savedScores = nextScores;
  persistence.persistSavedScores(nextScores);
  editorState.selectedSavedId = savedScore.id;
  editorState.libraryName = name;
  editorState.setLibraryStatus("Arquivo salvo no navegador.", "success");
}

export function loadSavedScore() {
  const target = editorState.selectedSavedScore;
  if (!target) {
    editorState.setLibraryStatus(
      "Selecione um arquivo salvo para carregar.",
      "warning",
    );
    return;
  }
  if (playbackState.isPlaying) playbackState.stop();
  scoreState.loadScore(target.score);
  editorState.libraryName = target.name;
  editorState.setLibraryStatus("Arquivo carregado com sucesso.", "success");
}

export function deleteSavedScore() {
  const target = editorState.selectedSavedScore;
  if (!target) {
    editorState.setLibraryStatus(
      "Selecione um arquivo salvo para excluir.",
      "warning",
    );
    return;
  }
  const name = target.name;
  const nextScores = editorState.savedScores.filter(
    (item) => item.id !== target.id,
  );
  editorState.savedScores = nextScores;
  persistence.persistSavedScores(nextScores);
  editorState.selectedSavedId = "";
  editorState.setLibraryStatus(`"${name}" excluída do navegador.`, "success");
}

export function exportCurrentScore() {
  if (!scoreState.value) {
    editorState.setLibraryStatus(
      "Não foi possível exportar: partitura indisponível.",
      "error",
    );
    return;
  }
  const name = persistence.safeName(
    editorState.libraryName ||
      scoreState.value.title ||
      scoreState.value.genre ||
      "levada",
  );
  const payload: ExportedScore = {
    format: persistence.SCORE_FORMAT,
    formatVersion: persistence.SCORE_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    score: {
      ...persistence.cloneScore(scoreState.value),
      type: scoreState.value.type || "personal",
    },
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${persistence.safeName(name).toLowerCase().replace(/\s+/g, "-")}.pdb.json`;
  link.click();
  URL.revokeObjectURL(url);
  editorState.setLibraryStatus("Arquivo exportado em .pdb.json.", "success");
}

export async function importScoreFile(file: File) {
  try {
    const isJsonLike =
      file.type === "application/json" ||
      file.name.endsWith(".json") ||
      file.name.endsWith(".pdb.json");
    if (!isJsonLike) {
      editorState.setLibraryStatus(
        "Arquivo inválido. Use um .json ou .pdb.json.",
        "error",
      );
      return;
    }
    if (file.size > MAX_IMPORT_SIZE_BYTES) {
      editorState.setLibraryStatus(
        "Arquivo muito grande. Limite de 512 KB.",
        "error",
      );
      return;
    }

    const rawParsed: unknown = JSON.parse(await file.text());
    if (!isObjectRecord(rawParsed)) {
      editorState.setLibraryStatus(
        "Arquivo inválido: JSON deve ser um objeto.",
        "error",
      );
      return;
    }

    const isWrappedFormat = rawParsed.format === persistence.SCORE_FORMAT;
    if (isWrappedFormat) {
      if (!("score" in rawParsed)) {
        editorState.setLibraryStatus(
          'Arquivo inválido: campo "score" ausente.',
          "error",
        );
        return;
      }
      if (
        "formatVersion" in rawParsed &&
        typeof rawParsed.formatVersion === "number" &&
        rawParsed.formatVersion > persistence.SCORE_FORMAT_VERSION
      ) {
        editorState.setLibraryStatus(
          "Arquivo usa uma versão mais nova do formato e não pode ser importado.",
          "error",
        );
        return;
      }
    }

    const importedScore = isWrappedFormat
      ? persistence.normalizeScore(rawParsed.score)
      : persistence.normalizeScore(rawParsed);
    if (!importedScore) {
      editorState.setLibraryStatus(
        "Arquivo inválido ou formato não reconhecido.",
        "error",
      );
      return;
    }
    if (playbackState.isPlaying) playbackState.stop();
    const importedPersonalScore = persistence.personalScore(
      importedScore,
      importedScore.title,
    );
    scoreState.loadScore(importedPersonalScore);
    editorState.libraryName = importedPersonalScore.title;
    editorState.selectedSavedId = "";
    editorState.setLibraryStatus("Arquivo importado com sucesso.", "success");
  } catch {
    editorState.setLibraryStatus(
      "Falha ao ler o arquivo. Verifique se o JSON está válido.",
      "error",
    );
  }
}
