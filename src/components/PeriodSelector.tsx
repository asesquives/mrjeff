import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DashboardPeriod,
  PeriodMode,
  buildMonthOptions,
  buildWeekOptions,
} from "@/lib/period";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns";
import { es } from "date-fns/locale";
import { useMemo } from "react";
import type { DateRange } from "react-day-picker";

interface Props {
  value: DashboardPeriod;
  onChange: (p: DashboardPeriod) => void;
}

export default function PeriodSelector({ value, onChange }: Props) {
  const monthOptions = useMemo(buildMonthOptions, []);
  const weekOptions = useMemo(buildWeekOptions, []);

  const monthValue = format(startOfMonth(value.date), "yyyy-MM");
  const weekValue = format(
    startOfWeek(value.date, { weekStartsOn: 1 }),
    "yyyy-'W'II"
  );

  const handleMode = (mode: PeriodMode) => {
    if (mode === "month") {
      onChange({ mode: "month", date: startOfMonth(new Date()) });
    } else if (mode === "week") {
      onChange({
        mode: "week",
        date: startOfWeek(new Date(), { weekStartsOn: 1 }),
      });
    } else if (mode === "ytd") {
      onChange({ mode: "ytd", date: startOfYear(new Date()) });
    } else {
      onChange({
        mode: "custom",
        date: new Date(),
        customStart: startOfMonth(new Date()),
        customEnd: endOfMonth(new Date()),
      });
    }
  };

  const dateRange: DateRange | undefined =
    value.mode === "custom" && value.customStart
      ? { from: value.customStart, to: value.customEnd }
      : undefined;

  const customLabel =
    value.mode === "custom" && value.customStart && value.customEnd
      ? `${format(value.customStart, "d MMM yyyy", { locale: es })} - ${format(value.customEnd, "d MMM yyyy", { locale: es })}`
      : "Selecciona un rango";

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Tabs value={value.mode} onValueChange={(v) => handleMode(v as PeriodMode)}>
        <TabsList>
          <TabsTrigger value="ytd">YTD</TabsTrigger>
          <TabsTrigger value="month">Mes</TabsTrigger>
          <TabsTrigger value="week">Semana</TabsTrigger>
          <TabsTrigger value="custom">Personalizado</TabsTrigger>
        </TabsList>
      </Tabs>

      {value.mode === "month" && (
        <Select
          value={monthValue}
          onValueChange={(v) => {
            const opt = monthOptions.find((m) => m.value === v);
            if (opt) onChange({ mode: "month", date: opt.date });
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {value.mode === "week" && (
        <Select
          value={weekValue}
          onValueChange={(v) => {
            const opt = weekOptions.find((w) => w.value === v);
            if (opt) onChange({ mode: "week", date: opt.date });
          }}
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {weekOptions.map((w) => (
              <SelectItem key={w.value} value={w.value}>
                {w.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {value.mode === "custom" && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {customLabel}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={(range) => {
                if (range?.from) {
                  onChange({
                    mode: "custom",
                    date: range.from,
                    customStart: range.from,
                    customEnd: range.to ?? range.from,
                  });
                }
              }}
              numberOfMonths={2}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
