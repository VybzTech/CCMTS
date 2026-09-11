/**
 * Port of the PHP app's pages/admin/couriers.php - courier roster with
 * performance stats (styles/app.css's .couriers-grid / .courier-card
 * family) plus an inline "add courier" form and an availability
 * toggle per card.
 */
import { useState } from 'react';
import type { FormEvent } from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/form/TextField';
import { EmptyState } from '../../components/ui/EmptyState';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useToast } from '../../components/ui/Toast/useToast';
import { createCourier, fetchCouriers, updateCourierAvailability } from '../../services/courierService';
import { extractErrorMessage } from '../../services/apiClient';

export function CouriersPage() {
  const { data: couriers, isLoading, error, reload } = useAsyncData(() => fetchCouriers(), []);
  const { showToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) return;
    setIsSubmitting(true);
    try {
      await createCourier({ name: form.name, email: form.email || undefined, phone: form.phone || undefined });
      showToast('success', 'Courier added.');
      setForm({ name: '', email: '', phone: '' });
      setShowForm(false);
      reload();
    } catch (err) {
      showToast('error', extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleAvailability(id: string, current: boolean) {
    setTogglingId(id);
    try {
      await updateCourierAvailability(id, { availability: !current });
      reload();
    } catch (err) {
      showToast('error', extractErrorMessage(err));
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <AppShell pageTitle="Courier Pool">
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1>Courier Pool</h1>
            <p>Manage couriers and their availability for deliveries.</p>
          </div>
          <Button variant="primary" onClick={() => setShowForm((v) => !v)}>
            <i className="fas fa-plus" /> Add Courier
          </Button>
        </div>

        {showForm && (
          <Card>
            <CardHeader title="New Courier" />
            <CardBody>
              <form className="form-row" onSubmit={handleCreate} style={{ alignItems: 'flex-end' }}>
                <TextField
                  label="Name"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
                <TextField
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
                <TextField
                  label="Phone"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
                <div className="form-actions" style={{ marginTop: 0 }}>
                  <Button type="submit" variant="primary" isLoading={isSubmitting}>
                    Save
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        )}

        {error && (
          <div className="alert alert-danger">
            <i className="fas fa-circle-exclamation" />
            <span>{error}</span>
          </div>
        )}

        {!isLoading && !error && (
          <>
            {(couriers ?? []).length === 0 ? (
              <Card>
                <CardBody>
                  <EmptyState icon="fa-truck" title="No couriers yet" description="Add your first courier to start assigning deliveries." />
                </CardBody>
              </Card>
            ) : (
              <div className="couriers-grid">
                {couriers!.map((courier) => (
                  <div className="courier-card" key={courier.id}>
                    <div className="courier-header">
                      <div className="courier-info">
                        <h3>{courier.name}</h3>
                        <span className={`availability-badge ${courier.availability ? 'available' : 'unavailable'}`}>
                          {courier.availability ? 'Available' : 'Unavailable'}
                        </span>
                      </div>
                      <div className="courier-performance">
                        <span className="performance-label">Performance</span>
                        <span className="performance-value">{courier.performance}%</span>
                      </div>
                    </div>

                    <div className="courier-stats">
                      <div className="stat-item">
                        <span className="stat-label">Active Tasks</span>
                        <span className="stat-value">{courier.activeTasks}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Completed</span>
                        <span className="stat-value success">{courier.completedDeliveries}</span>
                      </div>
                    </div>

                    <div className="courier-actions">
                      <Button
                        variant={courier.availability ? 'secondary' : 'success'}
                        size="sm"
                        isLoading={togglingId === courier.id}
                        onClick={() => handleToggleAvailability(courier.id, courier.availability)}
                      >
                        Mark {courier.availability ? 'Unavailable' : 'Available'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
