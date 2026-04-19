import React, { useEffect } from 'react';
import { X, Printer, Download, Lock } from 'lucide-react';
import type { WorkPermit } from '../../types';
import { MOCK_USERS } from '../../data/mockData';

interface Props {
  permit: WorkPermit;
  onClose: () => void;
}

/* ── Helpers ────────────────────────────────────────────────────────────── */
const getUser = (id?: string) => MOCK_USERS.find(u => u.id === id);

const fd = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '___________';
const ft = (iso?: string) =>
  iso ? new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '_______';
const fdt = (iso?: string) => iso ? `${fd(iso)}  ${ft(iso)}` : '_______________';

/* ── Print styles ─────────────────────────────────────────────────────── */
const PRINT_CSS = `
  @page { size: A4 portrait; margin: 15mm 18mm 18mm 18mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Times New Roman', Times, serif;
    font-size: 10pt;
    color: #000;
    background: #fff;
  }
  h1 { font-size: 11pt; font-weight: bold; text-align: center; text-transform: uppercase; letter-spacing: 0.5px; }
  h2 { font-size: 10pt; font-weight: bold; text-align: center; }
  table { border-collapse: collapse; width: 100%; }
  td, th { border: 1px solid #000; padding: 3px 5px; vertical-align: top; font-size: 9pt; }
  th { font-weight: bold; text-align: center; background: #f5f5f5; }
  .no-border td { border: none; padding: 2px 0; }
  .section-title { font-weight: bold; text-align: center; font-size: 9pt; margin: 6px 0 2px; }
  .field-line { border-bottom: 1px solid #000; display: inline-block; vertical-align: bottom; }
  .page-break { page-break-before: always; }
  .eds-mark { font-size: 7.5pt; border: 1px solid #555; padding: 0 2px; background: #f0f0f0; font-style: normal; }
  .sig-block { min-height: 18px; }
  .row-label { font-weight: bold; width: 38%; }
  .center { text-align: center; }
  .right  { text-align: right; }
  .bold   { font-weight: bold; }
  .small  { font-size: 8pt; }
  .italic { font-style: italic; }
  .underline { text-decoration: underline; }
  p { margin: 3px 0; }
  .spacer { height: 6px; }
  .divider { border-top: 1px solid #000; margin: 8px 0; }
  .dashed { border-top: 1px dashed #999; margin: 6px 0; }
  .note { font-size: 7.5pt; color: #555; margin-top: 10px; border-top: 1px solid #ccc; padding-top: 5px; }
`;

/* ── Signature cell for print ─────────────────────────────────────────── */
function SigPrint({ sig }: { sig?: { userName: string; timestamp: string } }) {
  if (!sig) return <span className="field-line" style={{ minWidth: 100 }}>&nbsp;</span>;
  return (
    <span>
      <span className="eds-mark">ЭЦП</span>{' '}
      <span style={{ fontSize: '8pt' }}>{sig.userName.split(' ').slice(0, 2).join(' ')}</span>
      <br />
      <span style={{ fontSize: '7.5pt', color: '#555' }}>{fdt(sig.timestamp)}</span>
    </span>
  );
}

/* ── The document body ────────────────────────────────────────────────── */
function PermitDocument({ permit }: { permit: WorkPermit }) {
  const issuer   = getUser(permit.issuerId);
  const manager  = getUser(permit.managerId);
  const admitter = getUser(permit.admitterId);
  const foreman  = getUser(permit.foremanId);
  const observer = getUser(permit.observerId);
  const disp     = getUser(permit.dispatcherId);
  const assist   = getUser(permit.dispatcherAssistantId);

  const activeMembers = permit.brigadeMembers.filter(m => m.isActive);
  const removedMembers = permit.brigadeMembers.filter(m => !m.isActive);
  const brigadeStr = activeMembers.map(m => `${m.name} (гр.${m.group})`).join(', ') || '—';

  const S = (label: string, value?: string, width = 200) => (
    <span>
      {label}:{' '}
      <span className="field-line" style={{ minWidth: width, paddingLeft: 4, display: 'inline-block', verticalAlign: 'bottom' }}>
        {value || ''}
      </span>
    </span>
  );

  const CELL_H = { height: 24 } as React.CSSProperties;

  return (
    <div id="permit-doc" style={{ fontFamily: '"Times New Roman", serif', fontSize: '10pt', color: '#000' }}>

      {/* ══════════════════ ЛИЦЕВАЯ СТОРОНА ══════════════════════════════ */}

      {/* Org block */}
      <table className="no-border" style={{ marginBottom: 4 }}>
        <tbody>
          <tr>
            <td style={{ width: '55%', border: 'none', paddingBottom: 3 }}>
              {S('Организация', permit.organization, 220)}
            </td>
            <td style={{ border: 'none', paddingBottom: 3 }}>
              {S('Подразделение', permit.department, 180)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: 6 }}>
        <h1 style={{ fontSize: 12, letterSpacing: 0.5 }}>Наряд-допуск на производство работ</h1>
        <p style={{ fontSize: '9pt', marginTop: 2 }}>
          <strong>№ <span style={{ borderBottom: '1px solid #000', display: 'inline-block', minWidth: 50, textAlign: 'center' }}>{permit.number}</span></strong>
          &nbsp;&nbsp;&nbsp;
          Дата выдачи: <span style={{ borderBottom: '1px solid #000', display: 'inline-block', minWidth: 90 }}>{fd(permit.issuerSignature?.timestamp)}</span>
          &nbsp;
          Время: <span style={{ borderBottom: '1px solid #000', display: 'inline-block', minWidth: 50 }}>{ft(permit.issuerSignature?.timestamp)}</span>
        </p>
      </div>

      {/* Personnel */}
      <table className="no-border" style={{ marginBottom: 4 }}>
        <tbody>
          <tr>
            <td style={{ border: 'none', width: '50%', paddingBottom: 3 }}>
              {S('Ответственному руководителю работ', manager?.name, 130)}
            </td>
            <td style={{ border: 'none', paddingBottom: 3 }}>
              {S('Допускающему', admitter?.name, 150)}
            </td>
          </tr>
          <tr>
            <td style={{ border: 'none', paddingBottom: 3 }}>
              {S('Производителю работ', foreman?.name, 155)}
            </td>
            <td style={{ border: 'none', paddingBottom: 3 }}>
              {S('Наблюдающему', observer?.name, 160)}
            </td>
          </tr>
          <tr>
            <td colSpan={2} style={{ border: 'none', paddingBottom: 3 }}>
              С членами бригады:{' '}
              <span className="field-line" style={{ display: 'inline-block', minWidth: 400, verticalAlign: 'bottom' }}>
                {brigadeStr}
              </span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Task */}
      <p style={{ marginBottom: 3 }}>
        Поручается:{' '}
        <span className="field-line" style={{ display: 'inline-block', width: '100%', minHeight: 14, borderBottom: '1px solid #000' }}>
          {permit.task}
        </span>
      </p>

      {/* Dates */}
      <table className="no-border" style={{ marginBottom: 6 }}>
        <tbody>
          <tr>
            <td style={{ border: 'none', width: '50%', paddingTop: 2 }}>
              Работу начать: дата{' '}
              <span className="field-line" style={{ minWidth: 90, display: 'inline-block', verticalAlign: 'bottom' }}>{fd(permit.workStartDateTime)}</span>{' '}
              время{' '}
              <span className="field-line" style={{ minWidth: 50, display: 'inline-block', verticalAlign: 'bottom' }}>{ft(permit.workStartDateTime)}</span>
            </td>
            <td style={{ border: 'none', paddingTop: 2 }}>
              Работу окончить: дата{' '}
              <span className="field-line" style={{ minWidth: 90, display: 'inline-block', verticalAlign: 'bottom' }}>{fd(permit.workEndDateTime)}</span>{' '}
              время{' '}
              <span className="field-line" style={{ minWidth: 50, display: 'inline-block', verticalAlign: 'bottom' }}>{ft(permit.workEndDateTime)}</span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Table 1 */}
      <p className="section-title">Таблица 1 — Меры по подготовке рабочих мест</p>
      <table style={{ marginBottom: 6 }}>
        <thead>
          <tr>
            <th style={{ width: '50%' }}>
              Наименование электроустановок, в которых необходимо произвести
              отключения и установить заземления
            </th>
            <th style={{ width: '50%' }}>
              Что должно быть отключено и где должны быть установлены заземления
            </th>
          </tr>
          <tr>
            <th style={{ fontWeight: 'normal', fontSize: '8pt' }}>1</th>
            <th style={{ fontWeight: 'normal', fontSize: '8pt' }}>2</th>
          </tr>
        </thead>
        <tbody>
          {permit.safetyMeasures.length > 0 ? (
            permit.safetyMeasures.map((m, i) => {
              const sep = m.indexOf('\x1F');
              const installation = sep >= 0 ? m.slice(0, sep) : m;
              const measures     = sep >= 0 ? m.slice(sep + 1) : '';
              return (
                <tr key={i}>
                  <td style={{ minHeight: 22, fontSize: '9pt' }}>{installation}</td>
                  <td style={{ minHeight: 22, fontSize: '9pt' }}>{measures || '\u00A0'}</td>
                </tr>
              );
            })
          ) : (
            [1, 2, 3].map(n => (
              <tr key={n}><td style={CELL_H}>&nbsp;</td><td style={CELL_H}>&nbsp;</td></tr>
            ))
          )}
        </tbody>
      </table>

      {/* Special instructions */}
      {permit.specialInstructions && (
        <p style={{ marginBottom: 5 }}>
          <strong>Особые указания:</strong>{' '}
          <span className="field-line" style={{ display: 'inline-block', minWidth: 300 }}>
            {permit.specialInstructions}
          </span>
        </p>
      )}

      {/* Issuer signature */}
      <table className="no-border" style={{ marginBottom: 4 }}>
        <tbody>
          <tr>
            <td style={{ border: 'none', width: '50%', paddingBottom: 2 }}>
              Наряд выдал: дата{' '}
              <span className="field-line" style={{ minWidth: 90, display: 'inline-block', verticalAlign: 'bottom' }}>
                {fd(permit.issuerSignature?.timestamp)}
              </span>{' '}
              время{' '}
              <span className="field-line" style={{ minWidth: 50, display: 'inline-block', verticalAlign: 'bottom' }}>
                {ft(permit.issuerSignature?.timestamp)}
              </span>
            </td>
            <td style={{ border: 'none' }}>
              Подпись{' '}
              <span className="field-line sig-block" style={{ minWidth: 80, display: 'inline-block', verticalAlign: 'bottom' }}>
                {permit.issuerSignature ? <span className="eds-mark">ЭЦП</span> : ''}
              </span>{' '}
              Фамилия{' '}
              <span className="field-line" style={{ minWidth: 130, display: 'inline-block', verticalAlign: 'bottom' }}>
                {issuer?.name || ''}
              </span>
            </td>
          </tr>
          {/* Extension */}
          {permit.extensions.length > 0 && permit.extensions.map((ext, ei) => (
            <React.Fragment key={ext.id}>
              <tr>
                <td style={{ border: 'none', paddingBottom: 2 }}>
                  Наряд продлён до: дата{' '}
                  <span className="field-line" style={{ minWidth: 90, display: 'inline-block', verticalAlign: 'bottom' }}>
                    {fd(ext.newEndDateTime)}
                  </span>{' '}
                  время{' '}
                  <span className="field-line" style={{ minWidth: 50, display: 'inline-block', verticalAlign: 'bottom' }}>
                    {ft(ext.newEndDateTime)}
                  </span>
                </td>
                <td style={{ border: 'none', paddingBottom: 2 }}>
                  Подпись{' '}
                  <span className="field-line sig-block" style={{ minWidth: 80, display: 'inline-block', verticalAlign: 'bottom' }}>
                    {ext.issuerSignature ? <span className="eds-mark">ЭЦП</span> : ''}
                  </span>{' '}
                  Фамилия{' '}
                  <span className="field-line" style={{ minWidth: 130, display: 'inline-block', verticalAlign: 'bottom' }}>
                    {ext.requestedByName}
                  </span>
                </td>
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>

      {/* Permission table */}
      <p className="section-title" style={{ marginTop: 8 }}>Разрешение на подготовку рабочих мест и на допуск к работе</p>
      <table style={{ marginBottom: 8 }}>
        <thead>
          <tr>
            <th style={{ width: '40%' }}>
              Разрешение выдал (должность, фамилия или подпись)
            </th>
            <th style={{ width: '25%' }}>Разрешение выдано (дата и время)</th>
            <th style={{ width: '35%' }}>
              Подпись лица, получившего разрешение
            </th>
          </tr>
          <tr>
            <th style={{ fontWeight: 'normal', fontSize: '8pt' }}>1</th>
            <th style={{ fontWeight: 'normal', fontSize: '8pt' }}>2</th>
            <th style={{ fontWeight: 'normal', fontSize: '8pt' }}>3</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ minHeight: 24 }}>
              {permit.dispatcherSignature
                ? `${disp?.position || 'Главный диспетчер'}, ${disp?.name || ''}`
                : <>&nbsp;<br />&nbsp;</>}
            </td>
            <td className="center" style={{ fontSize: '8.5pt' }}>
              {permit.dispatcherSignature ? fdt(permit.dispatcherSignature.timestamp) : ''}
            </td>
            <td className="center">
              {permit.dispatcherAssistantSignature ? (
                <>
                  <span className="eds-mark">ЭЦП</span>{' '}
                  <span style={{ fontSize: '8.5pt' }}>{assist?.name}</span>
                  <br />
                  <span style={{ fontSize: '7.5pt', color: '#666' }}>{fdt(permit.dispatcherAssistantSignature.timestamp)}</span>
                </>
              ) : ''}
            </td>
          </tr>
          <tr>
            <td style={CELL_H}>&nbsp;</td>
            <td style={CELL_H}>&nbsp;</td>
            <td style={CELL_H}>&nbsp;</td>
          </tr>
        </tbody>
      </table>

      {/* ══════════════════ ОБОРОТНАЯ СТОРОНА ════════════════════════════ */}
      <div className="dashed" />
      <p style={{ textAlign: 'center', fontStyle: 'italic', fontSize: '8.5pt', marginBottom: 6 }}>
        Обратная сторона наряда
      </p>

      {/* Workplace readiness */}
      <p style={{ marginBottom: 3 }}>
        Рабочее место подготовлено. Под напряжением остались:{' '}
        <span className="field-line" style={{ display: 'inline-block', minWidth: 260, verticalAlign: 'bottom' }}>
          {permit.liveParts || ''}
        </span>
      </p>
      <table className="no-border" style={{ marginBottom: 8 }}>
        <tbody>
          <tr>
            <td style={{ border: 'none', width: '50%' }}>
              Допускающий{' '}
              <span className="field-line" style={{ minWidth: 90, display: 'inline-block', verticalAlign: 'bottom', textAlign: 'center' }}>
                {permit.admitterWorkplaceSignature ? <span className="eds-mark">ЭЦП</span> : ''}
              </span>
              {'  '}
              <span style={{ fontSize: '8pt', fontStyle: 'italic' }}>(подпись)</span>
            </td>
            <td style={{ border: 'none' }}>
              Отв. руководитель / Производитель работ{' '}
              <span className="field-line" style={{ minWidth: 80, display: 'inline-block', verticalAlign: 'bottom', textAlign: 'center' }}>
                {permit.workplaceVerifierSignature ? <span className="eds-mark">ЭЦП</span> : ''}
              </span>
              {'  '}
              <span style={{ fontSize: '8pt', fontStyle: 'italic' }}>(подпись)</span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Table 3 — Daily briefings */}
      <p className="section-title">Таблица 3 — Ежедневный допуск к работе и её окончание</p>
      <table style={{ marginBottom: 8, fontSize: '8.5pt' }}>
        <thead>
          <tr>
            <th rowSpan={2} style={{ width: '18%' }}>Наименование места работы</th>
            <th colSpan={4}>П��оведён инструктаж бригаде и осуществлён допуск на подготовленное рабочее место</th>
            <th colSpan={2}>Работа окончена, бригада выведена</th>
          </tr>
          <tr>
            <th style={{ width: '11%' }}>Дата, время</th>
            <th style={{ width: '13%' }}>Допускающий</th>
            <th style={{ width: '13%' }}>Произв. работ (Набл.)</th>
            <th style={{ width: '17%' }}>Члены бригады</th>
            <th style={{ width: '11%' }}>Дата, время</th>
            <th style={{ width: '17%' }}>Подпись произв. работ</th>
          </tr>
          <tr>
            {[1,2,3,4,5,6,7].map(n => (
              <th key={n} style={{ fontWeight: 'normal', fontSize: '7.5pt' }}>{n}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {permit.dailyBriefings.length > 0 ? (
            permit.dailyBriefings.map((b, idx) => (
              <tr key={b.id}>
                <td style={{ fontSize: '8pt' }}>
                  {b.workLocationName}
                  {b.isFirst && <span style={{ fontSize: '7pt', fontStyle: 'italic' }}> (перв.)</span>}
                </td>
                <td className="center" style={{ fontSize: '7.5pt' }}>
                  {b.briefingDateTime ? `${fd(b.briefingDateTime)}\n${ft(b.briefingDateTime)}` : ''}
                </td>
                <td className="center" style={{ fontSize: '7.5pt' }}>
                  {b.admitterSignature ? (
                    <><span className="eds-mark">ЭЦП</span><br />
                    <span style={{ fontSize: '7pt' }}>{admitter?.shortName || b.admitterSignature.userName.split(' ').slice(0,2).join(' ')}</span></>
                  ) : ''}
                </td>
                <td className="center" style={{ fontSize: '7.5pt' }}>
                  {b.responsibleSignature ? (
                    <><span className="eds-mark">ЭЦП</span><br />
                    <span style={{ fontSize: '7pt' }}>{b.responsibleSignature.userName.split(' ').slice(0,2).join(' ')}</span></>
                  ) : ''}
                </td>
                <td style={{ fontSize: '7pt', lineHeight: '1.3' }}>
                  {b.brigadeSignatures.length > 0
                    ? b.brigadeSignatures.map(s => `ЭЦП ${s.memberName}`).join('; ')
                    : ''}
                </td>
                <td className="center" style={{ fontSize: '7.5pt' }}>
                  {b.endDateTime ? `${fd(b.endDateTime)}\n${ft(b.endDateTime)}` : ''}
                </td>
                <td className="center" style={{ fontSize: '7.5pt' }}>
                  {b.endSignature ? (
                    <><span className="eds-mark">ЭЦП</span><br />
                    <span style={{ fontSize: '7pt' }}>{b.endSignature.userName.split(' ').slice(0,2).join(' ')}</span></>
                  ) : ''}
                </td>
              </tr>
            ))
          ) : (
            [1, 2, 3].map(n => (
              <tr key={n}>
                {[...Array(7)].map((_, i) => (
                  <td key={i} style={{ height: 22 }}>&nbsp;</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Table 4 — Brigade changes */}
      {removedMembers.length > 0 && (
        <>
          <p className="section-title">Таблица 4 — Изменения в составе бригады</p>
          <table style={{ marginBottom: 8, fontSize: '8.5pt' }}>
            <thead>
              <tr>
                <th style={{ width: '30%' }}>Введён в состав бригады (Ф.И.О., группа)</th>
                <th style={{ width: '30%' }}>Выведен из состава бригады (Ф.И.О., группа)</th>
                <th style={{ width: '20%' }}>Дата, время</th>
                <th style={{ width: '20%' }}>Разрешил (подпись)</th>
              </tr>
              <tr>
                {[1,2,3,4].map(n => (
                  <th key={n} style={{ fontWeight: 'normal', fontSize: '7.5pt' }}>{n}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {removedMembers.map(m => (
                <tr key={m.id}>
                  <td style={{ height: 20 }}>&nbsp;</td>
                  <td>{m.name} (гр.{m.group})</td>
                  <td className="center" style={{ fontSize: '8pt' }}>{fdt(m.removedAt)}</td>
                  <td>&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Closure block */}
      <div style={{ borderTop: '1.5px solid #000', paddingTop: 6 }}>
        <p style={{ marginBottom: 4 }}>
          Работа полностью окончена, бригада с рабочего места выведена, заземления, установленные бригадой, сняты.
        </p>
        <p style={{ marginBottom: 3 }}>
          Сообщено (кому):{' '}
          <span className="field-line" style={{ display: 'inline-block', minWidth: 300, verticalAlign: 'bottom' }}>
            {permit.closureNotifyPerson || ''}
          </span>
        </p>
        <table className="no-border" style={{ marginBottom: 4 }}>
          <tbody>
            <tr>
              <td style={{ border: 'none', width: '50%' }}>
                Дата{' '}
                <span className="field-line" style={{ minWidth: 100, display: 'inline-block', verticalAlign: 'bottom' }}>
                  {fd(permit.closureDateTime)}
                </span>
              </td>
              <td style={{ border: 'none' }}>
                Время{' '}
                <span className="field-line" style={{ minWidth: 60, display: 'inline-block', verticalAlign: 'bottom' }}>
                  {ft(permit.closureDateTime)}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        <table className="no-border">
          <tbody>
            <tr>
              <td style={{ border: 'none', width: '50%' }}>
                Производитель работ (наблюдающий){' '}
                <span className="field-line" style={{ minWidth: 90, display: 'inline-block', verticalAlign: 'bottom', textAlign: 'center' }}>
                  {permit.foremanClosureSignature ? <span className="eds-mark">ЭЦП</span> : ''}
                </span>
                {'  '}
                <span style={{ fontSize: '8pt', fontStyle: 'italic' }}>(подпись)</span>
                {permit.foremanClosureSignature && (
                  <span style={{ fontSize: '8.5pt' }}> {foreman?.shortName}</span>
                )}
              </td>
              {permit.managerClosureSignature && (
                <td style={{ border: 'none' }}>
                  Ответственный руководитель{' '}
                  <span className="field-line" style={{ minWidth: 90, display: 'inline-block', verticalAlign: 'bottom', textAlign: 'center' }}>
                    <span className="eds-mark">ЭЦП</span>
                  </span>
                  {'  '}
                  <span style={{ fontSize: '8pt', fontStyle: 'italic' }}>(подпись)</span>
                  <span style={{ fontSize: '8.5pt' }}> {manager?.shortName}</span>
                </td>
              )}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer note */}
      <div className="note">
        <p>
          «ЭЦП» — квалифицированная электронная цифровая подпись (ГОСТ Р 34.10-2012).
          Документ сформирован автоматически системой электронного наряда-допуска.
          Дата формирования: {new Date().toLocaleString('ru-RU')}.
        </p>
      </div>
    </div>
  );
}

/* ── Main modal component ─────────────────────────────────────────────── */
export function PrintPermitModal({ permit, onClose }: Props) {
  const isClosed = permit.status === 'closed';

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  /* ESC to close */
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const openPrintWindow = (autoPrint = false) => {
    const el = document.getElementById('permit-doc');
    if (!el) return;
    const win = window.open('', '_blank', 'width=900,height=800,scrollbars=yes');
    if (!win) return;
    win.document.write(`<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <title>Наряд-допуск №${permit.number}</title>
  <style>${PRINT_CSS}</style>
</head>
<body>${el.outerHTML}</body>
</html>`);
    win.document.close();
    if (autoPrint) {
      win.focus();
      setTimeout(() => win.print(), 500);
    }
  };

  const handlePrint = () => openPrintWindow(true);
  const handleSavePDF = () => {
    openPrintWindow(false);
    // User can Ctrl+P → Save as PDF in the new window
  };

  return (
    <div className="fixed inset-0 z-[150] flex flex-col bg-gray-800">

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-gray-900 px-4 py-3 flex items-center gap-3 border-b border-gray-700">
        {/* Left */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-7 h-7 bg-white/10 rounded flex items-center justify-center flex-shrink-0">
            <Lock size={13} className="text-white/60" />
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm truncate">
              Наряд-допуск № {permit.number} — Версия для печати
            </p>
            <p className="text-white/40 text-[10px]">
              {isClosed ? 'Наряд закрыт · документ финальный' : 'Предварительный просмотр · документ не финальный'}
            </p>
          </div>
          {!isClosed && (
            <span className="flex-shrink-0 text-[10px] text-amber-400 bg-amber-400/15 border border-amber-400/30 px-2 py-0.5 rounded">
              Наряд не закрыт
            </span>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleSavePDF}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-300 border border-gray-600 rounded hover:bg-gray-700 hover:text-white transition-colors"
            title="Открыть в новом окне → Ctrl+P → Сохранить как PDF"
          >
            <Download size={13} />
            <span className="hidden sm:inline">Сохранить PDF</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white text-gray-900 rounded hover:bg-gray-100 transition-colors"
          >
            <Printer size={13} />
            <span className="hidden sm:inline">Распечатать</span>
          </button>
          <div className="w-px h-6 bg-gray-600" />
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1.5">
            <X size={15} />
          </button>
        </div>
      </div>

      {/* ── Page preview area ───────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto bg-gray-700 py-8 px-4">
        {/* A4 page simulation */}
        <div
          className="mx-auto bg-white shadow-2xl"
          style={{
            width: 794,          /* A4 @ 96dpi */
            minHeight: 1123,
            padding: '18mm 20mm 20mm 20mm',
            fontFamily: '"Times New Roman", Times, serif',
            fontSize: 10,
            color: '#000',
            position: 'relative',
          }}
        >
          <PermitDocument permit={permit} />
        </div>

        {/* PDF hint */}
        <p className="text-center text-gray-400 text-[11px] mt-4">
          Для сохранения в PDF: «Сохранить PDF» → в диалоге печати выберите «Сохранить как PDF»
        </p>
      </div>

      {/* Embedded print styles */}
      <style>{`
        @media print {
          body { margin: 0; }
        }
      `}</style>
    </div>
  );
}
