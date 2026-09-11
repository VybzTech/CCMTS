/**
 * Port of the PHP app's pages/admin/directorates.php - full CRUD over
 * directorates (list/create/update/delete all exist in
 * API_DOCUMENTATION.md, unlike couriers which only supports create +
 * two PATCH sub-resources). Edit is inline per-card rather than a
 * separate page/modal, since a directorate only has three editable
 * fields.
 */
import { useState } from 'react';
import type { FormEvent } from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/form/TextField';
import { TextareaField } from '../../components/ui/form/TextareaField';
import { EmptyState } from '../../components/ui/EmptyState';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useToast } from '../../components/ui/Toast/useToast';
import { useConfirm } from '../../components/ui/Modal/useConfirm';
import {
  createDirectorate,
  deleteDirectorate,
  fetchDirectorates,
  updateDirectorate,
} from '../../services/directorateService';
import { extractErrorMessage } from '../../services/apiClient';
import type { Directorate } from '../../types/api';

export function DirectoratesPage() {
  const { data: directorates, isLoading, error, reload } = useAsyncData(() => fetchDirectorates(), []);
  const { showToast } = useToast();
  const confirm = useConfirm();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  return (
    <AppShell pageTitle="Directorates">
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1>Directorates</h1>
            <p>Manage the directorates letters can be registered under.</p>
          </div>
          <Button variant="primary" onClick={() => setShowCreateForm((v) => !v)}>
            <i className="fas fa-plus" /> Add Directorate
          </Button>
        </div>

        {showCreateForm && (
          <CreateDirectorateCard
            onCancel={() => setShowCreateForm(false)}
            onCreated={() => {
              setShowCreateForm(false);
              reload();
            }}
          />
        )}

        {error && (
          <div className="alert alert-danger">
            <i className="fas fa-circle-exclamation" />
            <span>{error}</span>
          </div>
        )}

        {!isLoading && !error && (
          <>
            {(directorates ?? []).length === 0 ? (
              <Card>
                <CardBody>
                  <EmptyState icon="fa-building" title="No directorates yet" description="Add your first directorate to let ODU users register letters." />
                </CardBody>
              </Card>
            ) : (
              <div className="directorates-grid">
                {directorates!.map((dir) =>
                  editingId === dir.id ? (
                    <EditDirectorateCard
                      key={dir.id}
                      directorate={dir}
                      onCancel={() => setEditingId(null)}
                      onSaved={() => {
                        setEditingId(null);
                        reload();
                      }}
                    />
                  ) : (
                    <div className="directorate-card" key={dir.id}>
                      <div className="directorate-header">
                        <div className="directorate-info">
                          <h3>{dir.name}</h3>
                          <span className="secondary-text">{dir.code}</span>
                        </div>
                      </div>
                      {dir.description && <p className="secondary-text mb-md">{dir.description}</p>}
                      <div className="courier-actions">
                        <Button variant="secondary" size="sm" onClick={() => setEditingId(dir.id)}>
                          <i className="fas fa-pen" /> Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          isLoading={busyId === dir.id}
                          onClick={async () => {
                            const ok = await confirm({
                              title: 'Delete Directorate',
                              message: `Delete "${dir.name}"? Directorates with existing users or letters can't be deleted.`,
                              variant: 'danger',
                              confirmLabel: 'Delete',
                            });
                            if (!ok) return;
                            setBusyId(dir.id);
                            try {
                              await deleteDirectorate(dir.id);
                              showToast('success', 'Directorate deleted.');
                              reload();
                            } catch (err) {
                              showToast('error', extractErrorMessage(err));
                            } finally {
                              setBusyId(null);
                            }
                          }}
                        >
                          <i className="fas fa-trash" /> Delete
                        </Button>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

function CreateDirectorateCard({ onCancel, onCreated }: { onCancel: () => void; onCreated: () => void }) {
  const { showToast } = useToast();
  const [form, setForm] = useState({ name: '', code: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.name.trim() || !form.code.trim()) return;
    setIsSubmitting(true);
    try {
      await createDirectorate({ name: form.name, code: form.code, description: form.description || undefined });
      showToast('success', 'Directorate created.');
      onCreated();
    } catch (err) {
      showToast('error', extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader title="New Directorate" />
      <CardBody>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <TextField label="Name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <TextField label="Code" required value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
          </div>
          <TextareaField
            label="Description"
            rows={2}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Save
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}

function EditDirectorateCard({
  directorate,
  onCancel,
  onSaved,
}: {
  directorate: Directorate;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const { showToast } = useToast();
  const [name, setName] = useState(directorate.name);
  const [description, setDescription] = useState(directorate.description ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await updateDirectorate(directorate.id, { name, description });
      showToast('success', 'Directorate updated.');
      onSaved();
    } catch (err) {
      showToast('error', extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="directorate-card">
      <form onSubmit={handleSubmit}>
        <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <TextareaField label="Description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        <div className="form-actions">
          <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
            Save
          </Button>
        </div>
      </form>
    </div>
  );
}
