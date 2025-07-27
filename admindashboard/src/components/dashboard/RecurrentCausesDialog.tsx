'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Badge } from '../ui/badge';

type RecurrentCausesDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  causes: string[];
  isLoading: boolean;
};

export function RecurrentCausesDialog({ open, onOpenChange, causes, isLoading }: RecurrentCausesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Recurrent Cause Analysis</DialogTitle>
          <DialogDescription>
            AI-powered analysis of recurrent causes based on all issue descriptions.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p>Analyzing descriptions...</p>
            </div>
          ) : (
            <div className="space-y-2">
              {causes.length > 0 ? (
                causes.map((cause, index) => (
                  <div key={index} className="flex items-start gap-2 rounded-lg border p-3">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-500 mt-0.5" />
                    <span className="text-sm">{cause}</span>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground">No specific recurrent causes were identified.</p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
