import dayjs from 'dayjs';

// Todas as datas do app (prazos de fechamento, horários de jogo) são pensadas em
// horário de Brasília (BRT = UTC-3, sem horário de verão desde 2019).
// Os componentes de data/hora abaixo NUNCA dependem do fuso horário configurado
// no dispositivo — o mesmo valor digitado deve gravar sempre o mesmo instante UTC,
// não importa em que fuso está o computador de quem preenche o formulário.
const BRT_OFFSET_MS = -3 * 60 * 60 * 1000;

// Converte um valor dayjs (vindo de um DatePicker) para ISO string em UTC,
// tratando os componentes exibidos (ano/mês/dia/hora/min) como horário de Brasília.
export function brtDayjsToIso(val) {
  if (!val) return null;
  return new Date(Date.UTC(
    val.year(), val.month(), val.date(),
    val.hour() + 3, val.minute(), 0, 0
  )).toISOString();
}

// Converte um instante ISO (UTC) para um dayjs cujos componentes locais
// (os que o DatePicker exibe) representam o horário de Brasília correspondente.
export function isoToBrtDayjs(iso) {
  if (!iso) return null;
  const shifted = new Date(new Date(iso).getTime() + BRT_OFFSET_MS);
  return dayjs(new Date(
    shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate(),
    shifted.getUTCHours(), shifted.getUTCMinutes(), 0, 0
  ));
}

// Formata um instante ISO (UTC) como horário de Brasília, para exibição —
// independente do fuso do dispositivo de quem está vendo a tela.
export function formatBrt(iso, fmt) {
  if (!iso) return '';
  return isoToBrtDayjs(iso).format(fmt);
}
