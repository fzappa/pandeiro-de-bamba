export type TutorialStep = {
  target: string;
  title: string;
  body: string;
};

export const tutorialSteps: TutorialStep[] = [
  {
    target: "score",
    title: "1) Escolha onde escrever",
    body: "Clique em um espaço vazio da pauta para posicionar o cursor. Se quiser, ajuste o BPM antes de começar.",
  },
  {
    target: "sound-tools",
    title: "2) Escolha o toque e a figura",
    body: "Use as ferramentas para escolher toque e duração. Em seguida clique na pauta ou no pandeiro para inserir a nota no cursor.",
  },
  {
    target: "pandeiro",
    title: "3) Toque e pré-escute",
    body: "Passe o mouse nas regiões para pré-escutar e clique no pandeiro para inserir rapidamente o som na pauta.",
  },
  {
    target: "tools",
    title: "4) Dê play",
    body: "Use os controles de reprodução para ouvir o compasso em loop e ajustar até soar como você quer.",
  },
  {
    target: "library",
    title: "5) Salve sua primeira levada",
    body: "Na área Arquivo, salve para continuar depois. Você também pode importar e exportar em .pdb.json.",
  },
];
