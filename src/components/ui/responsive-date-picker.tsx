// components/ui/responsive-date-picker.tsx
"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";

interface ResponsiveDatePickerProps {
  date?: Date;
  onDateChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
}

export function ResponsiveDatePicker({
  date,
  onDateChange,
  placeholder = "Pick a date",
  disabled = false,
  className,
  buttonClassName,
}: ResponsiveDatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const isMobile = useIsMobile();

  const handleDateSelect = (selectedDate: Date | undefined) => {
    onDateChange(selectedDate);
    setOpen(false);
  };

  const triggerButton = (
    <Button
      variant="outline"
      className={cn(
        "w-full justify-start text-left font-normal h-12 touch-manipulation border-2",
        !date && "text-muted-foreground",
        buttonClassName
      )}
      disabled={disabled}
    >
      <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
      <span className="truncate">
        {date ? format(date, "PPP") : placeholder}
      </span>
    </Button>
  );

  if (isMobile) {
    return (
      <div className={className}>
        <Button
          variant="outline"
          onClick={() => setOpen(true)}
          className={cn(
            "w-full justify-start text-left font-normal h-12 touch-manipulation border-2",
            !date && "text-muted-foreground",
            buttonClassName
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
          <span className="truncate">
            {date ? format(date, "PPP") : placeholder}
          </span>
        </Button>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="w-[95vw] max-w-sm border-2 border-border shadow-brutal fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] z-50">
            <DialogHeader>
              <DialogTitle>Select Date</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center p-4">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateSelect}
                disabled={(date) =>
                  date > new Date() || date < new Date("1900-01-01")
                }
                initialFocus
                className="border-2 border-border rounded-md"
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          {triggerButton}
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-0 border-2 border-border shadow-brutal" 
          align="start"
          sideOffset={8}
        >
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            disabled={(date) =>
              date > new Date() || date < new Date("1900-01-01")
            }
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}