/**
 * Wraps styles/app.css's .card / .card-header / .card-body. Compose
 * them like plain HTML:
 *
 *   <Card>
 *     <CardHeader title="Recent Letters" action={<Link to="/letters">View All</Link>} />
 *     <CardBody>...</CardBody>
 *   </Card>
 *
 * CardHeader's `action` slot is for the one-button-on-the-right pattern
 * the PHP app used constantly (card-header h3 + a single "View All" /
 * "Filter" button) - for anything more complex, skip the prop and pass
 * whatever markup you need as children instead.
 */
import type { HTMLAttributes, ReactNode } from 'react';

export function Card({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`card${className ? ` ${className}` : ''}`} {...rest}>
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: ReactNode;
  action?: ReactNode;
}

export function CardHeader({ title, action }: CardHeaderProps) {
  return (
    <div className="card-header">
      <h3>{title}</h3>
      {action}
    </div>
  );
}

export function CardBody({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`card-body${className ? ` ${className}` : ''}`} {...rest}>
      {children}
    </div>
  );
}
