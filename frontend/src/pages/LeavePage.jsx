import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, getDay, parse, startOfWeek } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { ArrowLeft, Bell, CalendarDays, Check, Clock3, Send, X } from 'lucide-react'
import { Link } from 'react-router-dom'

import { leaveApi } from '../api/leave'
import { useAuth } from '../context/AuthContext'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales: { 'en-US': enUS } })
const statusStyle = {
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  Approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Rejected: 'bg-rose-50 text-rose-700 border-rose-200',
}

const toInputDate = (value) => format(value, 'yyyy-MM-dd')
const inclusiveEnd = (value) => new Date(new Date(`${value}T00:00:00`).getTime() + 86400000)

export default function LeavePage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const canReview = ['admin', 'hr'].includes(user?.role)
  const [selection, setSelection] = useState({ start: '', end: '' })
  const [decision, setDecision] = useState(null)
  const [message, setMessage] = useState(null)
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { leave_type: 'Paid', remarks: '' },
  })

  const history = useQuery({ queryKey: ['leaves', 'me'], queryFn: leaveApi.myHistory })
  const requests = useQuery({
    queryKey: ['leaves', 'all'], queryFn: () => leaveApi.all(), enabled: canReview,
  })
  const notifications = useQuery({ queryKey: ['notifications'], queryFn: leaveApi.notifications })

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['leaves'] })
    queryClient.invalidateQueries({ queryKey: ['notifications'] })
    queryClient.invalidateQueries({ queryKey: ['attendance'] })
  }
  const applyMutation = useMutation({
    mutationFn: leaveApi.apply,
    onSuccess: () => {
      setMessage({ type: 'success', text: 'Your leave request is now with HR.' })
      setSelection({ start: '', end: '' }); reset(); refresh()
    },
    onError: (error) => setMessage({ type: 'error', text: error.response?.data?.detail || 'Could not submit leave.' }),
  })
  const decisionMutation = useMutation({
    mutationFn: ({ action, id, comment }) => leaveApi[action](id, comment),
    onSuccess: () => { setDecision(null); refresh() },
  })
  const readMutation = useMutation({
    mutationFn: leaveApi.markRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const visibleLeaves = useMemo(
    () => (canReview ? requests.data || [] : history.data || []),
    [canReview, history.data, requests.data],
  )
  const events = useMemo(() => visibleLeaves.map((item) => ({
    id: item.id,
    title: `${item.employee_name} · ${item.leave_type}`,
    start: new Date(`${item.start_date}T00:00:00`),
    end: inclusiveEnd(item.end_date),
    resource: item,
  })), [visibleLeaves])

  const onSelectSlot = ({ start, end }) => setSelection({
    start: toInputDate(start),
    end: toInputDate(new Date(end.getTime() - 86400000)),
  })
  const submitLeave = (data) => {
    setMessage(null)
    if (!selection.start || !selection.end) {
      setMessage({ type: 'error', text: 'Select your leave dates on the calendar.' }); return
    }
    applyMutation.mutate({ ...data, start_date: selection.start, end_date: selection.end })
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"><ArrowLeft size={18} /></Link>
            <div><p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-600">PeopleFlow</p><h1 className="text-xl font-extrabold">Leave & Time Off</h1></div>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold capitalize text-slate-600">{user?.role} workspace</span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-7 sm:px-6">
        <section className="grid gap-4 sm:grid-cols-3">
          {[
            ['Pending', visibleLeaves.filter((item) => item.status === 'Pending').length, Clock3, 'text-amber-600 bg-amber-50'],
            ['Approved', visibleLeaves.filter((item) => item.status === 'Approved').length, Check, 'text-emerald-600 bg-emerald-50'],
            ['Unread updates', (notifications.data || []).filter((item) => !item.is_read).length, Bell, 'text-indigo-600 bg-indigo-50'],
          ].map(([label, value, Icon, color]) => (
            <article key={label} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className={`grid h-11 w-11 place-items-center rounded-xl ${color}`}><Icon size={21} /></span><div><strong className="text-2xl">{value}</strong><p className="text-xs font-semibold text-slate-500">{label}</p></div>
            </article>
          ))}
        </section>

        <section className={`grid gap-6 ${canReview ? '' : 'lg:grid-cols-[1.45fr_.55fr]'}`}>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center gap-3"><CalendarDays className="text-emerald-600" /><div><h2 className="font-extrabold">Time-off calendar</h2><p className="text-xs text-slate-500">{canReview ? 'Team leave schedule' : 'Drag across dates to start a request'}</p></div></div>
            <div className="leave-calendar h-[520px]">
              <Calendar
                localizer={localizer} events={events} startAccessor="start" endAccessor="end"
                selectable={!canReview} onSelectSlot={onSelectSlot} views={['month']} defaultView="month"
                eventPropGetter={(event) => ({ className: `leave-event leave-${event.resource.status.toLowerCase()}` })}
              />
            </div>
          </div>

          {!canReview && (
            <form onSubmit={handleSubmit(submitLeave)} className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="font-extrabold">Apply for leave</h2><p className="mb-5 mt-1 text-xs text-slate-500">Choose dates on the calendar, then add the details.</p>
              <div className="mb-4 grid grid-cols-2 gap-3 text-xs"><label>From<input type="date" value={selection.start} onChange={(e) => setSelection({ ...selection, start: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-2.5" /></label><label>To<input type="date" value={selection.end} onChange={(e) => setSelection({ ...selection, end: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 p-2.5" /></label></div>
              <label className="text-xs font-semibold">Leave type<select {...register('leave_type')} className="mb-4 mt-1 w-full rounded-xl border border-slate-200 bg-white p-3"><option>Paid</option><option>Sick</option><option>Casual</option><option>Unpaid</option></select></label>
              <label className="text-xs font-semibold">Remarks<textarea {...register('remarks', { required: true, minLength: 3 })} rows="5" placeholder="Why do you need time off?" className="mt-1 w-full resize-none rounded-xl border border-slate-200 p-3" /></label>
              {errors.remarks && <p className="mt-1 text-xs text-rose-600">Please add at least 3 characters.</p>}
              {message && <p className={`mt-3 rounded-xl p-3 text-xs ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{message.text}</p>}
              <button disabled={applyMutation.isPending} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"><Send size={16} />{applyMutation.isPending ? 'Submitting…' : 'Submit request'}</button>
            </form>
          )}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.5fr_.5fr]">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5"><h2 className="font-extrabold">{canReview ? 'Review requests' : 'Leave history'}</h2></div>
            <div className="divide-y divide-slate-100">
              {!visibleLeaves.length && <p className="p-8 text-center text-sm text-slate-400">No leave requests yet.</p>}
              {visibleLeaves.map((item) => (
                <article key={item.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div><div className="flex flex-wrap items-center gap-2"><strong>{item.employee_name}</strong><span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusStyle[item.status]}`}>{item.status}</span></div><p className="mt-1 text-sm text-slate-600">{item.leave_type} · {item.start_date} → {item.end_date} · {item.working_days} workday(s)</p><p className="mt-1 text-xs text-slate-400">{item.remarks}</p>{item.reviewer_comment && <p className="mt-2 text-xs font-medium text-slate-600">HR comment: {item.reviewer_comment}</p>}</div>
                  {canReview && item.status === 'Pending' && <div className="flex gap-2"><button onClick={() => setDecision({ id: item.id, action: 'approve', name: item.employee_name })} className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">Approve</button><button onClick={() => setDecision({ id: item.id, action: 'reject', name: item.employee_name })} className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">Reject</button></div>}
                </article>
              ))}
            </div>
          </div>

          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="mb-4 flex items-center gap-2 font-extrabold"><Bell size={18} /> Notifications</h2><div className="space-y-3">{!(notifications.data || []).length && <p className="text-xs text-slate-400">No updates yet.</p>}{(notifications.data || []).map((item) => <button key={item.id} onClick={() => !item.is_read && readMutation.mutate(item.id)} className={`w-full rounded-xl border p-3 text-left ${item.is_read ? 'border-slate-100 bg-slate-50 opacity-70' : 'border-indigo-100 bg-indigo-50'}`}><strong className="block text-xs">{item.title}</strong><span className="mt-1 block text-[11px] leading-4 text-slate-500">{item.message}</span></button>)}</div></aside>
        </section>
      </main>

      {decision && <DecisionModal decision={decision} pending={decisionMutation.isPending} error={decisionMutation.error} onClose={() => setDecision(null)} onSubmit={(comment) => decisionMutation.mutate({ ...decision, comment })} />}
    </div>
  )
}

function DecisionModal({ decision, pending, error, onClose, onSubmit }) {
  const [comment, setComment] = useState('')
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><div className="flex justify-between"><div><p className="text-xs font-bold uppercase text-slate-400">Leave decision</p><h3 className="text-lg font-extrabold capitalize">{decision.action} {decision.name}’s request</h3></div><button onClick={onClose}><X size={20} /></button></div><textarea value={comment} onChange={(e) => setComment(e.target.value)} rows="4" placeholder="Add a clear comment for the employee…" className="mt-5 w-full rounded-xl border border-slate-200 p-3 text-sm" />{error && <p className="mt-2 text-xs text-rose-600">{error.response?.data?.detail || 'Could not process this request.'}</p>}<div className="mt-4 flex justify-end gap-2"><button onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-500">Cancel</button><button disabled={comment.trim().length < 2 || pending} onClick={() => onSubmit(comment)} className={`rounded-xl px-4 py-2 text-sm font-bold text-white disabled:opacity-50 ${decision.action === 'approve' ? 'bg-emerald-600' : 'bg-rose-600'}`}>{pending ? 'Saving…' : 'Confirm decision'}</button></div></div></div>
}
