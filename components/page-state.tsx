import { AlertCircle } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PageLoadingStateProps {
  label?: string;
  className?: string;
}

interface InlineErrorStateProps {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function PageLoadingState({
  label = 'Loading your dashboard...',
  className,
}: PageLoadingStateProps) {
  return (
    <div className={cn('flex min-h-[30vh] items-center justify-center px-4', className)}>
      <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner className="size-4" />
        <span>{label}</span>
      </div>
    </div>
  );
}

export function InlineErrorState({
  message,
  onRetry,
  retryLabel = 'Try again',
  className,
}: InlineErrorStateProps) {
  return (
    <Alert variant="destructive" className={cn('border-destructive/30', className)}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Something went wrong</AlertTitle>
      <AlertDescription className="mt-1 flex flex-wrap items-center gap-3">
        <span>{message}</span>
        {onRetry ? (
          <Button variant="outline" size="sm" onClick={onRetry}>
            {retryLabel}
          </Button>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}
