export const LESSONS = [
  { title: '1/4 · MOVIMENTO', text: 'Ande para os dois lados. Aproxime-se sem pular.', goal: 'Mova-se pelo menos 120 pontos.' },
  { title: '2/4 · DEFESA', text: 'Segure DEF / U / R1. O parceiro vai dar um golpe leve.', goal: 'Defenda um golpe.' },
  { title: '3/4 · COMBO BÁSICO', text: 'Perto do parceiro, emende Leve → Médio → Forte → Especial.', goal: 'Acerte um combo de pelo menos 4 golpes.' },
  { title: '4/4 · COMBO AÉREO', text: 'Baixo + Forte levanta. Segure cima no acerto, então use Leve no ar.', goal: 'Acerte um golpe aéreo depois de lançar o parceiro.' },
];
export function createLesson(x) { return { index: 0, startX: x, complete: false, lifted: false, passed: [], skipped: [] }; }
export function advanceLesson(lesson, st) {
  if (!lesson || lesson.complete) return false;
  const hits = st.events.filter(e => e.t === 'hit' && e.side === 0);
  const wasLifted = lesson.lifted;
  if (st.f[0].y <= 0 && hits.some(e => e.launch)) lesson.lifted = true;
  const done = [
    Math.abs(st.f[0].x - lesson.startX) >= 120,
    st.events.some(e => ['block', 'perfect'].includes(e.t) && e.side === 0),
    hits.some(e => e.combo >= 4),
    wasLifted && st.f[0].y > 0 && hits.some(e => e.launch),
  ][lesson.index];
  if (!done) return false;
  lesson.passed.push(lesson.index++); lesson.lifted = false;
  lesson.complete = lesson.index >= LESSONS.length;
  return true;
}
export function skipLesson(lesson) {
  if (!lesson || lesson.complete) return;
  lesson.skipped.push(lesson.index++); lesson.lifted = false;
  lesson.complete = lesson.index >= LESSONS.length;
}
