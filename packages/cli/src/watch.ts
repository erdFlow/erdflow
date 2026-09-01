import chokidar from "chokidar";

export interface SchemaWatcher {
  close: () => Promise<void>;
}

export function watchSchemaSource(
  watchPaths: string[],
  onChange: () => void,
  debounceMs = 150,
): SchemaWatcher {
  let timer: NodeJS.Timeout | undefined;

  const watcher = chokidar.watch(watchPaths, {
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: debounceMs,
      pollInterval: 50,
    },
  });

  const schedule = () => {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      onChange();
    }, debounceMs);
  };

  watcher.on("add", schedule);
  watcher.on("change", schedule);
  watcher.on("unlink", schedule);

  return {
    async close() {
      if (timer) {
        clearTimeout(timer);
      }
      await watcher.close();
    },
  };
}
