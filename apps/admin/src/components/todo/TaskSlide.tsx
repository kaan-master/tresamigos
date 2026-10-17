import { useEffect, useRef, useState } from 'react';
import { Check, ListTodo, Save, Trash2, X } from 'lucide-react';
import { api, downloadBlob, todoBlob } from './api';
import { DatePick } from './DateTimePick';
import { SearchPick } from './SearchPick';
import { humanError, useTodoUi } from './ui';
import { TASK_STATUSES, colleagueNames } from '@tresamigos/utils';

type Person = { id: string; name: string; avatarData?: string | null };

const AVATAR = ['#579bfc', '#00c875', '#fdab3d', '#e2445c', '#a25ddc', '#ff642e', '#007eb5', '#037f4c'];

function avatarColor(name: string): string {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) hash = (hash + name.charCodeAt(index)) % AVATAR.length;
  return AVATAR[hash];
}

function ColleagueFace({ person }: { person: Person }) {
  if (person.avatarData) return <span className="task-avatar has-photo"><img src={person.avatarData} alt="" /></span>;
  const parts = person.name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length === 0 ? '?' : parts.length === 1 ? parts[0].slice(0, 2).toUpperCase() : `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return <span className="task-avatar" style={{ background: avatarColor(person.name) }}>{letters}</span>;
}
type TaskCustomer = { id: string; companyName: string };
type Category = { id: string; name: string; color: string };
type TaskComment = { id: string; body: string; createdAt: string; author: Person };
type TaskFile = { id: string; name: string; mime: string; author: Person };

export type TaskDocument = { id: string; label: string; hint: string; kind: 'QUOTE' | 'INVOICE' };

export type SlideTask = {
  id: string;
  title: string;
  notes: string;
  status: string;
  customer: TaskCustomer | null;
  assignee: Person | null;
  assignees?: Person[];
  startDate: string | null;
  dueDate: string | null;
  includeInAgenda: boolean;
  categoryId: string | null;
  fields?: Record<string, string>;
};

export function TaskSlide({
  task,
  categories,
  colleagues,
  customers,
  documents,
  canWrite,
  onClose,
  onPatch,
  onRemove,
  onPlan,
  onCount,
}: {
  task: SlideTask;
  categories: Category[];
  colleagues: Person[];
  customers: Array<{ id: string; companyName: string; city?: string }>;
  documents: TaskDocument[];
  canWrite: boolean;
  onClose: () => void;
  onPatch: (id: string, body: Record<string, unknown>) => Promise<boolean>;
  onRemove: () => Promise<void>;
  onPlan: () => Promise<void>;
  onCount: (delta: number) => void;
}) {
  const { toast, confirm } = useTodoUi();
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes);
  const [startDate, setStartDate] = useState(task.startDate ?? '');
  const [dueDate, setDueDate] = useState(task.dueDate ?? '');
  const [comments, setComments] = useState<TaskComment[] | null>(null);
  const [files, setFiles] = useState<TaskFile[]>([]);
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const dirty = title.trim() !== task.title
    || notes !== task.notes
    || startDate !== (task.startDate ?? '')
    || dueDate !== (task.dueDate ?? '');

  useEffect(() => {
    setTitle(task.title);
    setNotes(task.notes);
    setStartDate(task.startDate ?? '');
    setDueDate(task.dueDate ?? '');
  }, [task.id, task.title, task.notes, task.startDate, task.dueDate]);

  useEffect(() => {
    let cancelled = false;
    void api<{ comments: TaskComment[]; files: TaskFile[] }>(`/tasks/${task.id}/activity`)
      .then((data) => {
        if (cancelled) return;
        setComments(data.comments);
        setFiles(data.files);
      })
      .catch((err: unknown) => { if (!cancelled) toast('error', humanError(err, 'Het item kon niet worden geopend.')); });
    return () => { cancelled = true; };
  }, [task.id, toast]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function saveDraft() {
    const nextTitle = title.trim();
    if (!nextTitle) {
      setTitle(task.title);
      return;
    }
    const body: Record<string, unknown> = {};
    if (nextTitle !== task.title) body.title = nextTitle;
    if (notes !== task.notes) body.notes = notes;
    if (startDate !== (task.startDate ?? '')) body.startDate = startDate || null;
    if (dueDate !== (task.dueDate ?? '')) body.dueDate = dueDate || null;
    if (!Object.keys(body).length) return;
    setSaving(true);
    const ok = await onPatch(task.id, body);
    setSaving(false);
    if (ok) toast('success', 'Taak opgeslagen.');
  }

  async function sendComment() {
    const body = reply.trim();
    if (!body) return;
    setBusy(true);
    try {
      const created = await api<TaskComment>(`/tasks/${task.id}/comments`, 'POST', { body });
      setComments((current) => [...(current ?? []), created]);
      setReply('');
      onCount(1);
    } catch (err: unknown) {
      toast('error', humanError(err, 'De reactie kon niet worden geplaatst.'));
    } finally {
      setBusy(false);
    }
  }

  async function removeComment(comment: TaskComment) {
    const ok = await confirm({
      title: 'Reactie verwijderen?',
      body: 'Deze reactie verdwijnt uit de taak.',
      confirmLabel: 'Verwijderen',
      danger: true,
    });
    if (!ok) return;
    try {
      await api(`/tasks/${task.id}/comments/${comment.id}`, 'DELETE');
      setComments((current) => current?.filter((item) => item.id !== comment.id) ?? current);
      onCount(-1);
    } catch (err: unknown) {
      toast('error', humanError(err, 'De reactie kon niet worden verwijderd.'));
    }
  }

  async function upload(file: File) {
    if (file.size > 2 * 1024 * 1024) {
      toast('error', 'Een bijlage mag hoogstens 2 MB zijn.');
      return;
    }
    setBusy(true);
    try {
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = String(reader.result ?? '');
          const marker = result.indexOf(',');
          resolve(marker >= 0 ? result.slice(marker + 1) : result);
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
      const created = await api<TaskFile>(`/tasks/${task.id}/files`, 'POST', { name: file.name, mime: file.type || 'application/octet-stream', data });
      setFiles((current) => [...current, created]);
      onCount(1);
    } catch (err: unknown) {
      toast('error', humanError(err, 'De bijlage kon niet worden geüpload.'));
    } finally {
      setBusy(false);
    }
  }

  async function download(file: TaskFile) {
    try {
      const { blob, filename } = await todoBlob(`/tasks/${task.id}/files/${file.id}`);
      downloadBlob(blob, filename || file.name);
    } catch (err: unknown) {
      toast('error', humanError(err, 'De bijlage kon niet worden gedownload.'));
    }
  }

  async function removeFile(file: TaskFile) {
    const ok = await confirm({
      title: 'Bijlage verwijderen?',
      body: `“${file.name}” verdwijnt uit de taak.`,
      confirmLabel: 'Verwijderen',
      danger: true,
    });
    if (!ok) return;
    try {
      await api(`/tasks/${task.id}/files/${file.id}`, 'DELETE');
      setFiles((current) => current.filter((item) => item.id !== file.id));
      onCount(-1);
    } catch (err: unknown) {
      toast('error', humanError(err, 'De bijlage kon niet worden verwijderd.'));
    }
  }

  const writing = reply.trim().length > 0;
  const documentId = task.fields?.documentId ?? '';
  const documentLabel = task.fields?.documentLabel ?? '';
  const chosenDoc = documents.find((item) => item.id === documentId);

  return (
    <div className="task-slide-layer">
      <button type="button" className="task-slide-scrim" aria-label="Sluiten" onClick={onClose} />
      <aside className="task-slide" role="dialog" aria-label={task.title}>
        <header>
          <h2>Taak</h2>
          <button type="button" className="task-icon" aria-label="Sluiten" onClick={onClose}><X size={16} /></button>
        </header>
        <input
          className="task-slide-title"
          aria-label="Taaknaam"
          value={title}
          disabled={!canWrite}
          onChange={(event) => setTitle(event.target.value)}
        />
        <label>
          Status
          <select
            aria-label="Status"
            value={task.status}
            disabled={!canWrite}
            onChange={(event) => { void onPatch(task.id, { status: event.target.value }); }}
          >
            {TASK_STATUSES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
        <label>
          Categorie
          <select
            aria-label="Categorie"
            value={task.categoryId ?? ''}
            disabled={!canWrite}
            onChange={(event) => { void onPatch(task.id, { categoryId: event.target.value || null }); }}
          >
            <option value="">Geen categorie</option>
            {categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <div className="slide-colleagues">
          <span>Collega's</span>
          <strong>{colleagueNames((task.assignees?.length ? task.assignees : task.assignee ? [task.assignee] : []).map((person) => person.name)) || 'Niemand'}</strong>
          <div className="slide-colleague-picks">
            {colleagues.map((person) => {
              const current = task.assignees?.length ? task.assignees : task.assignee ? [task.assignee] : [];
              const picked = current.some((item) => item.id === person.id);
              return (
                <button
                  key={person.id}
                  type="button"
                  className={picked ? 'on' : ''}
                  aria-pressed={picked}
                  disabled={!canWrite}
                  onClick={() => {
                    const ids = current.map((item) => item.id);
                    const next = picked ? ids.filter((id) => id !== person.id) : [...ids, person.id];
                    void onPatch(task.id, { assigneeIds: next });
                  }}
                >
                  <ColleagueFace person={person} />
                  <span>{person.name}</span>
                  {picked ? <Check size={14} /> : null}
                </button>
              );
            })}
          </div>
        </div>
        <SearchPick
          label="Klant"
          selectedLabel={task.customer?.companyName ?? ''}
          placeholder="Zoek klant"
          noneLabel="Geen klant"
          disabled={!canWrite}
          options={customers.map((customer) => ({
            id: customer.id,
            label: customer.companyName,
            hint: customer.city,
          }))}
          onSelect={(id) => { void onPatch(task.id, { customerId: id || null }); }}
        />
        {documents.length > 0 ? (
          <SearchPick
            label="Offerte of factuur"
            selectedLabel={chosenDoc?.label ?? documentLabel}
            placeholder="Zoek offerte of factuur"
            noneLabel="Geen document"
            disabled={!canWrite}
            options={documents}
            onSelect={(id) => {
              const picked = documents.find((item) => item.id === id);
              void onPatch(task.id, {
                fields: {
                  documentId: picked?.id ?? '',
                  documentKind: picked?.kind ?? '',
                  documentLabel: picked?.label ?? '',
                },
              });
            }}
          />
        ) : null}
        <label>
          Van
          <DatePick
            value={startDate}
            disabled={!canWrite}
            ariaLabel="Startdatum"
            placeholder="Kies startdatum"
            onChange={setStartDate}
          />
        </label>
        <label>
          Tot en met
          <DatePick
            value={dueDate}
            disabled={!canWrite}
            ariaLabel="Einddatum"
            placeholder="Kies einddatum"
            onChange={setDueDate}
          />
        </label>
        {canWrite ? (
          <button type="button" className="primary task-slide-save" disabled={saving || !dirty} onClick={() => void saveDraft()}>
            <Save size={16} />{saving ? 'Opslaan…' : 'Opslaan'}
          </button>
        ) : null}
        <button type="button" className="task-slide-plan" onClick={() => void onPlan()}>
          <ListTodo size={16} />
          {task.includeInAgenda ? 'Haal uit de agenda' : 'Zet in je agenda'}
        </button>
        {canWrite ? (
          <button type="button" className="task-slide-remove icon-only" aria-label="Taak verwijderen" title="Taak verwijderen" onClick={() => void onRemove()}><Trash2 size={15} /></button>
        ) : null}

        <aside className="task-item task-item-plain" role="region" aria-label="Notities en reacties">
          <label>
            Notitie
            <textarea rows={4} value={notes} disabled={!canWrite} onChange={(event) => setNotes(event.target.value)} />
          </label>
          <section>
            <div className="task-item-head">
              <h3>Bijlagen</h3>
              {canWrite ? <button type="button" disabled={busy} onClick={() => fileRef.current?.click()}>Uploaden</button> : null}
              <input
                ref={fileRef}
                className="logo-file"
                type="file"
                aria-label="Bijlage uploaden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = '';
                  if (file) void upload(file);
                }}
              />
            </div>
            {files.length === 0 ? <p>Nog geen bijlagen.</p> : (
              <ul>
                {files.map((file) => (
                  <li key={file.id}>
                    <button type="button" onClick={() => void download(file)}>{file.name}</button>
                    <small>{file.author.name}</small>
                    {canWrite ? <button type="button" className="task-icon" aria-label="Bijlage verwijderen" onClick={() => void removeFile(file)}><Trash2 size={13} /></button> : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="task-updates">
            <h3>Reacties</h3>
            {comments === null ? <p>Laden…</p> : comments.length === 0 ? <p>Nog geen reacties. Schrijf de eerste update bij dit item.</p> : (
              <ul>
                {comments.map((comment) => (
                  <li key={comment.id}>
                    <strong>{comment.author.name}</strong>
                    <small>{new Date(comment.createdAt).toLocaleString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</small>
                    <p>{comment.body}</p>
                    {canWrite ? <button type="button" className="icon-only" aria-label="Verwijderen" title="Verwijderen" onClick={() => void removeComment(comment)}><Trash2 size={15} /></button> : null}
                  </li>
                ))}
              </ul>
            )}
            {canWrite ? (
              <form onSubmit={(event) => { event.preventDefault(); void sendComment(); }}>
                <textarea rows={3} placeholder="Schrijf een reactie" aria-label="Reactie" value={reply} onChange={(event) => setReply(event.target.value)} />
                <button type="submit" className="primary" disabled={busy || !writing}>Plaatsen</button>
              </form>
            ) : null}
          </section>
        </aside>
      </aside>
    </div>
  );
}
