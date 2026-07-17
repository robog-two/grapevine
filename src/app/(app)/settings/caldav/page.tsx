import { requirePageUser } from '@/lib/session';
import { getCaldavAccount } from '@/lib/repo/caldav';
import { CaldavConnectForm } from '@/components/CaldavConnectForm';
import { connectCaldavAction, disconnectCaldavAction } from './actions';

export default async function CaldavSettingsPage() {
  const user = await requirePageUser();
  const account = await getCaldavAccount(user);

  return (
    <CaldavConnectForm
      initialAccount={account ? { serverUrl: account.serverUrl, account: account.account } : null}
      onConnect={connectCaldavAction}
      onDisconnect={disconnectCaldavAction}
    />
  );
}
