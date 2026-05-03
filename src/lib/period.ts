import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfYear,
  endOfDay,
  format,
  subMonths,
  subWeeks,
  subYears,
  differenceInCalendarDays,
} from "date-fns";
import { es } from "date-fns/locale";

export type PeriodMode = "month" | "week" | "ytd" | "custom";

export interface DashboardPeriod {
  mode: PeriodMode;
  /** Reference date for month/week modes; ignored for ytd/custom. */
  date: Date;
  /** Required when mode === "custom" */
  customStart?: Date;
  /** Required when mode === "custom" */
  customEnd?: Date;
}

export interface PeriodRange {
  start: Date;
  end: Date;
  label: string;
  /** granularity used by trend charts when this period is active */
  granularity: "week" | "month";
}

export function getPeriodRange(period: DashboardPeriod): PeriodRange {
  const { mode, date } = period;

  if (mode === "week") {
    const start = startOfWeek(date, { weekStartsOn: 1 });
    const end = endOfWeek(date, { weekStartsOn: 1 });
    return {
      start,
      end,
      label: `Semana del ${format(start, "d MMM", { locale: es })} - ${format(end, "d MMM yyyy", { locale: es })}`,
      granularity: "week",
    };
  }

  if (mode === "ytd") {
    const now = new Date();
    const start = startOfYear(now);
    const end = endOfDay(now);
    return {
      start,
      end,
      label: `YTD ${format(now, "yyyy")} (1 ene - ${format(end, "d MMM", { locale: es })})`,
      granularity: "month",
    };
  }

  if (mode === "custom") {
    const start = period.customStart ?? startOfMonth(new Date());
    const end = period.customEnd ?? endOfMonth(new Date());
    const startEod = new Date(start);
    startEod.setHours(0, 0, 0, 0);
    const endEod = endOfDay(end);
    const days = (endEod.getTime() - startEod.getTime()) / (1000 * 60 * 60 * 24);
    return {
      start: startEod,
      end: endEod,
      label: `${format(startEod, "d MMM yyyy", { locale: es })} - ${format(endEod, "d MMM yyyy", { locale: es })}`,
      granularity: days <= 70 ? "week" : "month",
    };
  }

  // month mode
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  return {
    start,
    end,
    label: format(start, "MMMM yyyy", { locale: es }),
    granularity: "month",
  };
}

export function getPreviousPeriodRange(
  period: DashboardPeriod
): PeriodRange & { shortLabel: string } {
  const { mode, date } = period;

  if (mode === "week") {
    const ref = subWeeks(date, 1);
    const start = startOfWeek(ref, { weekStartsOn: 1 });
    const end = endOfWeek(ref, { weekStartsOn: 1 });
    return {
      start,
      end,
      label: `Semana del ${format(start, "d MMM", { locale: es })} - ${format(end, "d MMM yyyy", { locale: es })}`,
      shortLabel: "semana anterior",
      granularity: "week",
    };
  }

  if (mode === "ytd") {
    const now = new Date();
    const lastYear = subYears(now, 1);
    const start = startOfYear(lastYear);
    const end = endOfDay(subYears(now, 1));
    return {
      start,
      end,
      label: `YTD ${format(lastYear, "yyyy")}`,
      shortLabel: `YTD ${format(lastYear, "yyyy")}`,
      granularity: "month",
    };
  }

  if (mode === "custom") {
    const cur = getPeriodRange(period);
    const days = differenceInCalendarDays(cur.end, cur.start) + 1;
    const end = new Date(cur.start.getTime() - 1);
    const start = new Date(end);
    start.setDate(start.getDate() - (days - 1));
    start.setHours(0, 0, 0, 0);
    return {
      start,
      end: endOfDay(end),
      label: `${format(start, "d MMM yyyy", { locale: es })} - ${format(end, "d MMM yyyy", { locale: es })}`,
      shortLabel: `${days} días previos`,
      granularity: cur.granularity,
    };
  }

  // month mode
  const ref = subMonths(startOfMonth(date), 1);
  const start = startOfMonth(ref);
  const end = endOfMonth(ref);
  return {
    start,
    end,
    label: format(start, "MMMM yyyy", { locale: es }),
    shortLabel: format(start, "MMMM yyyy", { locale: es }),
    granularity: "month",
  };
}

/** Últimos 12 meses, actual primero. */
export function buildMonthOptions() {
  return Array.from({ length: 12 }).map((_, i) => {
    const d = startOfMonth(subMonths(new Date(), i));
    return {
      value: format(d, "yyyy-MM"),
      label: format(d, "MMMM yyyy", { locale: es }),
      date: d,
    };
  });
}

/** Últimas 12 semanas (ISO, lunes), actual primero. */
export function buildWeekOptions() {
  return Array.from({ length: 12 }).map((_, i) => {
    const d = startOfWeek(subWeeks(new Date(), i), { weekStartsOn: 1 });
    const end = endOfWeek(d, { weekStartsOn: 1 });
    return {
      value: format(d, "yyyy-'W'II"),
      label: `${format(d, "d MMM", { locale: es })} - ${format(end, "d MMM", { locale: es })}`,
      date: d,
    };
  });
}
