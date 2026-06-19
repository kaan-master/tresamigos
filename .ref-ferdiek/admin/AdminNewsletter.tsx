import { useEffect, useState } from 'react'
import { FiTrash2, FiMail, FiDownload } from 'react-icons/fi'
import { apiNewsletterSubscribers, apiNewsletterUnsubscribe, type NewsletterSubscriber } from '../api'

export default function AdminNewsletter({ token }: { token: string }) {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    apiNewsletterSubscribers(token)
      .then((r) => setSubscribers(r.subscribers))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token])

  const handleDelete = async (email: string) => {
    if (!window.confirm(`Abonnee ${email} verwijderen?`)) return
    await apiNewsletterUnsubscribe(token, email).catch(() => {})
    setSubscribers((s) => s.filter((sub) => sub.email !== email))
  }

  const exportCsv = () => {
    const rows = [['Email', 'Naam', 'Datum'], ...subscribers.map((s) => [s.email, s.name || '', s.subscribedAt || ''])]
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'nieuwsbrief.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const filtered = subscribers.filter((s) =>
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    (s.name || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {[
          { label: 'Abonnees totaal', value: subscribers.length, icon: <FiMail /> },
          { label: 'Deze maand', value: subscribers.filter(s => s.subscribedAt && new Date(s.subscribedAt).getMonth() === new Date().getMonth()).length, icon: <FiMail /> },
          { label: 'Exporteerbaar', value: 'CSV', icon: <FiDownload /> },
        ].map((k) => (
          <div key={k.label} style={{ background: '#FEF6EB', border: '1px solid rgba(90,70,58,0.12)', borderRadius: 4, padding: '20px 24px', display: 'grid', gap: 10 }}>
            <span style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(43,31,26,0.45)' }}>{k.label}</span>
            <strong style={{ fontSize: 36, fontWeight: 600, color: '#2b1f1a', fontFamily: "'Iowan Old Style',serif", lineHeight: 1 }}>{k.value}</strong>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <input
          placeholder="Zoek op naam of email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 220, padding: '10px 14px', border: '1px solid rgba(90,70,58,0.18)', borderRadius: 3, fontSize: 14, background: '#fff' }}
        />
        <button onClick={exportCsv} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', border: '1px solid #2b1f1a', borderRadius: 3, background: 'transparent', cursor: 'pointer', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          <FiDownload size={14} /> Exporteer CSV
        </button>
      </div>

      <div style={{ background: '#fff', border: '1px solid rgba(90,70,58,0.12)', borderRadius: 4, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8f3ec' }}>
              {['E-mail', 'Naam', 'Ingeschreven op', ''].map((h) => (
                <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(43,31,26,0.45)', borderBottom: '1px solid rgba(90,70,58,0.1)', fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ padding: 28, textAlign: 'center', color: 'rgba(43,31,26,0.4)' }}>Laden...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: 28, textAlign: 'center', color: 'rgba(43,31,26,0.4)' }}>Geen abonnees gevonden</td></tr>
            ) : filtered.map((sub, i) => (
              <tr key={sub.email} style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(90,70,58,0.07)' : 'none' }}>
                <td style={{ padding: '12px 16px', fontSize: 14, color: '#2b1f1a', fontFamily: 'monospace' }}>{sub.email}</td>
                <td style={{ padding: '12px 16px', fontSize: 14, color: 'rgba(43,31,26,0.7)' }}>{sub.name || '—'}</td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: 'rgba(43,31,26,0.5)' }}>{sub.subscribedAt ? new Date(sub.subscribedAt).toLocaleDateString('nl-NL') : '—'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <button onClick={() => void handleDelete(sub.email)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', border: '1px solid rgba(180,50,40,0.2)', borderRadius: 3, background: 'rgba(180,50,40,0.06)', color: '#b43228', cursor: 'pointer', fontSize: 12 }}>
                    <FiTrash2 size={12} /> Verwijder
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
