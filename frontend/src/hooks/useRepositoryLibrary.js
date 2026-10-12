import { useCallback, useEffect, useMemo, useState } from 'react';
import { repositoryApi } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';

/**
 * Loads the signed-in user's repository library + aggregate summary.
 * Every list is produced by a user-scoped backend query.
 */
export function useRepositoryLibrary() {
  const [repositories, setRepositories] = useState([]);
  const [summary, setSummary] = useState(null);
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, summaryResponse] = await Promise.all([
        repositoryApi.list(),
        repositoryApi.summary().catch(() => null),
      ]);
      setRepositories(list.repositories || []);
      setLanguages(list.languages || []);
      if (summaryResponse?.summary) setSummary(summaryResponse.summary);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const reanalyze = useCallback(
    async (repository, { silent = false } = {}) => {
      setBusyId(repository._id);
      if (!silent) toast.info(`Refreshing ${repository.fullName} from GitHub…`);
      try {
        const data = await repositoryApi.reanalyze(repository._id);
        setRepositories((current) =>
          current.map((repo) => (repo._id === repository._id ? data.repository : repo)),
        );
        const stars = data.deltas?.stars;
        toast.success(
          `${repository.fullName} refreshed${
            Number.isFinite(stars) && stars !== 0 ? ` · ${stars > 0 ? '+' : ''}${stars} stars` : ''
          }`,
        );
        return data.repository;
      } catch (err) {
        toast.error(err.message || 'Could not refresh this repository.');
        return null;
      } finally {
        setBusyId(null);
      }
    },
    [toast],
  );

  const remove = useCallback(
    async (repository) => {
      setBusyId(repository._id);
      try {
        await repositoryApi.remove(repository._id);
        setRepositories((current) => current.filter((repo) => repo._id !== repository._id));
        toast.success(`${repository.fullName} removed from your library.`);
        return true;
      } catch (err) {
        toast.error(err.message || 'Could not delete this repository.');
        return false;
      } finally {
        setBusyId(null);
      }
    },
    [toast],
  );

  const upsertRepository = useCallback((repository) => {
    setRepositories((current) => {
      const index = current.findIndex((repo) => repo._id === repository._id);
      if (index === -1) return [repository, ...current];
      const copy = [...current];
      copy[index] = repository;
      return copy;
    });
  }, []);

  return useMemo(
    () => ({
      repositories,
      summary,
      languages,
      loading,
      error,
      busyId,
      reload: load,
      reanalyze,
      remove,
      upsertRepository,
    }),
    [repositories, summary, languages, loading, error, busyId, load, reanalyze, remove, upsertRepository],
  );
}

export default useRepositoryLibrary;