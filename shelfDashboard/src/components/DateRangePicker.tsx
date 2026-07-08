import { useTranslation } from 'react-i18next'
import { Button, Input } from '#/components/ui'
import { presetMonth, presetToday, presetWeek } from '#/lib/dateRangePresets'
import type { DateRange } from '#/lib/types'

const DEFAULT_FROM_TIME = '00:00'
const DEFAULT_TO_TIME = '23:59'

function withTimeDefaults(range: DateRange): DateRange {
  return {
    ...range,
    fromTime: range.fromTime ?? DEFAULT_FROM_TIME,
    toTime: range.toTime ?? DEFAULT_TO_TIME,
  }
}

function presetWithTime(preset: () => DateRange): DateRange {
  return withTimeDefaults(preset())
}

export function DateRangePicker({
  value,
  onChange,
  showTime = false,
}: {
  value: DateRange
  onChange: (range: DateRange) => void
  showTime?: boolean
}) {
  const { t } = useTranslation()
  const fromTime = value.fromTime ?? DEFAULT_FROM_TIME
  const toTime = value.toTime ?? DEFAULT_TO_TIME

  const applyPreset = (preset: () => DateRange): void => {
    onChange(showTime ? presetWithTime(preset) : preset())
  }

  const applyChange = (patch: Partial<DateRange>): void => {
    if (showTime) {
      onChange(withTimeDefaults({ ...value, ...patch }))
      return
    }
    const next = { ...value, ...patch }
    delete next.fromTime
    delete next.toTime
    onChange(next)
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <Button variant="outline" size="md" onClick={() => applyPreset(presetToday)}>
        {t('reports.presets.today')}
      </Button>
      <Button variant="outline" size="md" onClick={() => applyPreset(presetWeek)}>
        {t('reports.presets.week')}
      </Button>
      <Button variant="outline" size="md" onClick={() => applyPreset(presetMonth)}>
        {t('reports.presets.month')}
      </Button>
      <label className="ml-2">
        <span className="block text-[13px] font-semibold text-slate-600">
          {t('reports.from')}
        </span>
        <div className="flex gap-2">
          <Input
            type="date"
            value={value.from}
            max={value.to}
            onChange={(e) => e.target.value && applyChange({ from: e.target.value })}
            className="w-44"
          />
          {showTime && (
            <Input
              type="time"
              value={fromTime}
              onChange={(e) => e.target.value && applyChange({ fromTime: e.target.value })}
              className="w-28"
            />
          )}
        </div>
      </label>
      <label>
        <span className="block text-[13px] font-semibold text-slate-600">
          {t('reports.to')}
        </span>
        <div className="flex gap-2">
          <Input
            type="date"
            value={value.to}
            min={value.from}
            onChange={(e) => e.target.value && applyChange({ to: e.target.value })}
            className="w-44"
          />
          {showTime && (
            <Input
              type="time"
              value={toTime}
              min={value.from === value.to ? fromTime : undefined}
              onChange={(e) => e.target.value && applyChange({ toTime: e.target.value })}
              className="w-28"
            />
          )}
        </div>
      </label>
    </div>
  )
}
