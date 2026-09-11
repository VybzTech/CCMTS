/**
 * Port of the PHP app's pages/letters/create.php - registers a single
 * letter via POST /letters/single. ODU-only (see navConfig.ts/App.tsx):
 * Admin/Management briefly had access to this page with an added
 * directorate picker (their directorateId is null), but that was
 * deliberately removed per product decision - they still keep Bulk
 * Upload (BulkUploadPage.tsx), which retains that picker since it's
 * still reachable for those roles. ODU registers against their own
 * directorate automatically, using their session directorate.
 */
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell';
import { Card, CardBody } from '../../components/ui/Card';
import { TextField } from '../../components/ui/form/TextField';
import { SelectField } from '../../components/ui/form/SelectField';
import { TextareaField } from '../../components/ui/form/TextareaField';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/ui/Toast/useToast';
import { createLetter } from '../../services/letterService';
import { extractErrorMessage } from '../../services/apiClient';
import type { LetterPriority } from '../../types/api';

interface FormState {
  recipientName: string;
  recipientAddress: string;
  subject: string;
  priority: LetterPriority;
  liabilityValue: string;
  notes: string;
}

const INITIAL_STATE: FormState = {
  recipientName: '',
  recipientAddress: '',
  subject: '',
  priority: 'Medium',
  liabilityValue: '0',
  notes: '',
};

export function LetterCreatePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function validate(): boolean {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};
    if (!form.recipientName.trim()) nextErrors.recipientName = 'Recipient name is required';
    if (!form.recipientAddress.trim()) nextErrors.recipientAddress = 'Recipient address is required';
    if (!form.subject.trim()) nextErrors.subject = 'Subject is required';
    if (Number(form.liabilityValue) < 0) nextErrors.liabilityValue = 'Liability value must be 0 or greater';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!validate()) return;

    const directorateId = user?.directorateId;
    if (!directorateId) return;

    setIsSubmitting(true);
    try {
      const result = await createLetter({
        sender_directorate_id: Number(directorateId),
        recipient_name: form.recipientName,
        recipient_address: form.recipientAddress,
        subject: form.subject,
        priority: form.priority,
        liability_value: Number(form.liabilityValue),
        notes: form.notes || undefined,
      });
      showToast('success', 'Letter registered successfully.');
      const newId = (result as { letter?: { id?: string } })?.letter?.id;
      navigate(newId ? `/letters/${newId}` : '/letters');
    } catch (err) {
      showToast('error', extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppShell pageTitle="Register Letter">
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1>Register Letter</h1>
            <p>Submit a new letter for approval and delivery.</p>
          </div>
        </div>

        <Card>
          <CardBody>
            <form className="form-card" onSubmit={handleSubmit} noValidate>
              <TextField
                label="Recipient Name"
                required
                value={form.recipientName}
                onChange={(e) => update('recipientName', e.target.value)}
                error={errors.recipientName}
              />
              <TextareaField
                label="Recipient Address"
                required
                rows={3}
                value={form.recipientAddress}
                onChange={(e) => update('recipientAddress', e.target.value)}
                error={errors.recipientAddress}
              />
              <TextField
                label="Subject"
                required
                value={form.subject}
                onChange={(e) => update('subject', e.target.value)}
                error={errors.subject}
              />

              <div className="form-row">
                <SelectField
                  label="Priority"
                  value={form.priority}
                  onChange={(e) => update('priority', e.target.value as LetterPriority)}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </SelectField>

                <div className="form-group">
                  <label htmlFor="liability_value">Liability Value</label>
                  <div className="input-prefix">
                    <span className="input-prefix-symbol" aria-hidden="true">₦</span>
                    <input
                      type="number"
                      id="liability_value"
                      min="0"
                      step="0.01"
                      value={form.liabilityValue}
                      onChange={(e) => update('liabilityValue', e.target.value)}
                    />
                  </div>
                  {errors.liabilityValue && <span className="error-text">{errors.liabilityValue}</span>}
                </div>
              </div>

              <TextareaField
                label="Notes"
                rows={3}
                value={form.notes}
                onChange={(e) => update('notes', e.target.value)}
              />

              <div className="form-actions">
                <Button type="button" variant="secondary" onClick={() => navigate('/letters')}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={isSubmitting}>
                  <i className="fas fa-paper-plane" /> Register Letter
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </AppShell>
  );
}
