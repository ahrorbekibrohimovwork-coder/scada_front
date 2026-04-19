import React, { useState } from 'react';
import {
  Calendar, CheckCircle2, Clock, AlertTriangle, PlayCircle, StopCircle,
  RefreshCw, ChevronRight, Info, Plus, XCircle, Send, Check,
} from 'lucide-react';
import type { DailyBriefing, BrigadeMember, WorkPermit } from '../../types';

interface Props {
  permit: WorkPermit;
  isForeman: boolean;
  isObserver: boolean;
  isAdmitter: boolean;
  onStartNewDay: () => void;
  onExtendPermit: () => void;
  onEndDay: () => void;
  onCheckCompletion: () => void;
  onRequestNextDay: () => void;
  onApproveNextDay: () => void;
}

const fmtDT = (iso?: string) =>
  iso ? new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';

export function DailyWorkFlow({
  permit, isForeman, isObserver, isAdmitter, onStartNewDay, onExtendPermit, onEndDay, onCheckCompletion,
  onRequestNextDay, onApproveNextDay,
}: Props) {
  const lastBriefing = permit.dailyBriefings[permit.dailyBriefings.length - 1];
  const canStartNewDay = permit.status === 'daily_ended' && !!lastBriefing?.endSignature;
  const isDayActive = permit.status === 'in_progress' || permit.status === 'admitted';
  const isDayEnded = permit.status === 'daily_ended';
  const workEndDate = new Date(permit.workEndDateTime);
  const isOverdue = workEndDate < new Date() && !['closed', 'cancelled'].includes(permit.status);
  const daysLeft = Math.ceil((workEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  // Calculate current day number
  const dayNumber = permit.dailyBriefings.length || 1;

  // Check if can extend - только один раз
  const canExtend = permit.extensions.length === 0;
  const extensionUsed = permit.extensions.length > 0;

  // Next day request status
  const nextDayRequest = permit.nextDayRequest;
  const hasActiveBriefing = isDayActive || isDayEnded;
  const canRequestNextDay = isForeman && isDayEnded && lastBriefing?.endSignature && !nextDayRequest;
  const hasPendingRequest = nextDayRequest?.status === 'pending';
  const canApproveRequest = isAdmitter && hasPendingRequest;

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-900 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-white/70" />
          <span className="text-white text-sm font-semibold">Ежедневный цикл работ</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white/50 text-xs">День {dayNumber}</span>
          {isDayActive && (
            <span className="flex items-center gap-1 bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold">
              <PlayCircle size={10} /> В работе
            </span>
          )}
          {isDayEnded && (
            <span className="flex items-center gap-1 bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold">
              <StopCircle size={10} /> День завершён
            </span>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Status Overview */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 border border-gray-200 rounded p-3">
            <div className="flex items-center gap-2 mb-1">
              <Clock size={12} className="text-gray-400" />
              <p className="text-[10px] text-gray-400 uppercase font-semibold">Срок окончания</p>
            </div>
            <p className={`text-sm font-mono font-semibold ${isOverdue ? 'text-red-600' : 'text-gray-800'}`}>
              {fmtDT(permit.workEndDateTime)}
            </p>
            {isOverdue ? (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <AlertTriangle size={10} /> Просрочен
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">
                {daysLeft > 0 ? `Осталось ${daysLeft} дн.` : 'Сегодня последний день'}
              </p>
            )}
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded p-3">
            <div className="flex items-center gap-2 mb-1">
              <Calendar size={12} className="text-gray-400" />
              <p className="text-[10px] text-gray-400 uppercase font-semibold">Дней работы</p>
            </div>
            <p className="text-sm font-mono font-semibold text-gray-800">{dayNumber}</p>
            <p className="text-xs text-gray-500 mt-1">
              {permit.extensions.length > 0 ? `Продлений: ${permit.extensions.length}` : 'Без продлений'}
            </p>
          </div>
        </div>

        {/* Last briefing info */}
        {lastBriefing && (
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <div className="flex items-center gap-2 mb-2">
              <Info size={12} className="text-blue-600" />
              <p className="text-xs font-semibold text-blue-800">
                {lastBriefing.isFirst ? 'Первичный допуск' : `Инструктаж дня ${dayNumber}`}
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs text-blue-700">Место работы:</span>
                <span className="text-xs text-blue-900 font-medium">{lastBriefing.workLocationName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-blue-700">Начало:</span>
                <span className="text-xs text-blue-900 font-mono">{fmtDT(lastBriefing.briefingDateTime)}</span>
              </div>
              {lastBriefing.endDateTime && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-blue-700">Окончание:</span>
                  <span className="text-xs text-blue-900 font-mono">{fmtDT(lastBriefing.endDateTime)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide">Доступные действия</p>

          {/* End current day */}
          {(isForeman || isObserver) && isDayActive && lastBriefing?.responsibleSignature && (
            <button
              onClick={onEndDay}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-sm font-medium transition-colors"
            >
              <StopCircle size={14} />
              <span className="flex-1 text-left">Завершить работы дня</span>
              <ChevronRight size={14} />
            </button>
          )}

          {/* Check completion */}
          {(isForeman || isObserver) && isDayEnded && (
            <button
              onClick={onCheckCompletion}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-gray-900 hover:bg-black text-white rounded text-sm font-medium transition-colors"
            >
              <CheckCircle2 size={14} />
              <span className="flex-1 text-left">Проверка завершения работ</span>
              <ChevronRight size={14} />
            </button>
          )}

          {/* Request next day (for foreman) */}
          {canRequestNextDay && (
            <button
              onClick={onRequestNextDay}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
            >
              <Send size={14} />
              <span className="flex-1 text-left">Запросить следующий рабочий день (День {dayNumber + 1})</span>
              <ChevronRight size={14} />
            </button>
          )}

          {/* Pending request notification */}
          {hasPendingRequest && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <div className="flex items-center gap-2 mb-2">
                <Send size={12} className="text-blue-600" />
                <p className="text-xs font-semibold text-blue-800">Запрос на следующий день</p>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-blue-700">Запросил:</span>
                  <span className="text-xs text-blue-900 font-medium">{nextDayRequest?.requestedByName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-blue-700">Дата запроса:</span>
                  <span className="text-xs text-blue-900 font-mono">{fmtDT(nextDayRequest?.requestedAt)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-blue-700">День:</span>
                  <span className="text-xs text-blue-900 font-bold">День {nextDayRequest?.dayNumber}</span>
                </div>
              </div>
            </div>
          )}

          {/* Approve next day (for admitter) */}
          {canApproveRequest && (
            <button
              onClick={onApproveNextDay}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-sm font-medium transition-colors"
            >
              <Check size={14} />
              <span className="flex-1 text-left">Одобрить следующий день (День {nextDayRequest?.dayNumber})</span>
              <PlayCircle size={14} />
            </button>
          )}

          {/* Extend permit */}
          {isForeman && (isDayEnded || isDayActive) && (
            <button
              onClick={canExtend ? onExtendPermit : undefined}
              disabled={!canExtend}
              title={extensionUsed ? 'Продление уже использовано' : 'Максимум 15 дней от текущей даты'}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded text-sm font-medium transition-colors ${
                canExtend
                  ? 'bg-white border border-orange-300 text-orange-700 hover:bg-orange-50'
                  : 'bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <RefreshCw size={14} />
              <span className="flex-1 text-left">
                {canExtend ? 'Продлить наряд (макс. 15 дн.)' : 'Продление использовано'}
              </span>
              {canExtend && <ChevronRight size={14} />}
            </button>
          )}
        </div>

        {/* Info panel */}
        <div className="bg-gray-50 border border-gray-200 rounded p-3">
          <div className="flex items-start gap-2">
            <Info size={12} className="text-gray-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-gray-600 space-y-1">
              <p>• Для начала следующего дня производитель работ запрашивает допуск у допускающего</p>
              <p>• Перед началом нового дня проверьте завершение работ текущего</p>
              <p>• Продление доступно один раз, максимум на 15 дней от текущей даты</p>
              <p>• При изменении условий работы или состава бригады &gt;50% наряд должен быть закрыт</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
