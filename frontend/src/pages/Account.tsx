import { useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useProfile, useFeedback } from '../App';
import { api, json } from '../api';
import { ErrorState } from '../ui';
export default function Account() {
  const user = useProfile();
  const [name, setName] = useState(user.displayName);
  const [zone, setZone] = useState(user.timeZone);
  const client = useQueryClient();
  const feedback = useFeedback();
  const save = useMutation({
    mutationFn: () => api('/account/profile', json('PUT', { displayName: name, timeZone: zone })),
    onSuccess: async () => {
      await client.invalidateQueries();
      feedback('Profile updated.');
    },
  });
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">ACCOUNT</span>
          <h1>Your workspace, your rhythm.</h1>
          <p>Set the details that keep your days in sync.</p>
        </div>
      </div>
      <form
        className="panel account-form"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <h2>Personal details</h2>
        <label>
          Display name
          <input required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          Email address
          <input value={user.email} readOnly />
          <small className="hint">Your sign-in address.</small>
        </label>
        <label>
          Timezone
          <input required list="timezones" value={zone} onChange={(e) => setZone(e.target.value)} />
          <datalist id="timezones">
            {[
              'UTC',
              'Africa/Cairo',
              'Europe/London',
              'Europe/Paris',
              'America/New_York',
              'America/Los_Angeles',
              'Asia/Kolkata',
              'Asia/Tokyo',
              'Australia/Sydney',
            ].map((z) => (
              <option key={z}>{z}</option>
            ))}
          </datalist>
          <small className="hint">
            Use an IANA timezone. Deadlines end at local midnight; recorded times display in this
            zone.
          </small>
        </label>
        {save.error && <ErrorState error={save.error} />}
        <button className="button primary" disabled={save.isPending}>
          {save.isPending ? 'Saving…' : 'Save profile'}
        </button>
      </form>
    </>
  );
}
