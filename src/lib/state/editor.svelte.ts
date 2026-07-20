import type { StrokeType } from "../types";
import type { SavedScore } from "../services/persistence";

class EditorState {
  selectedStroke = $state<StrokeType>("P");
  selectedDuration = $state<number>(16);
  savedScores = $state<SavedScore[]>([]);
  selectedLibraryId = $state("");
  selectedSavedId = $state("");
  libraryName = $state("");
  libraryStatus = $state("");
  libraryStatusKind = $state<"info" | "success" | "warning" | "error">("info");
  selectedGenreFilter = $state("Todos");

  selectedSavedScore = $derived(
    this.savedScores.find((item) => item.id === this.selectedSavedId) ?? null,
  );

  setLibraryStatus(
    message: string,
    kind: "info" | "success" | "warning" | "error" = "info",
  ) {
    this.libraryStatus = message;
    this.libraryStatusKind = kind;
    window.setTimeout(() => {
      if (this.libraryStatus === message) {
        this.libraryStatus = "";
        this.libraryStatusKind = "info";
      }
    }, 2600);
  }
}

export const editorState = new EditorState();
