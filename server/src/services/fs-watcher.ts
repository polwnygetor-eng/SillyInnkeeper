import chokidar, { type FSWatcher } from "chokidar";
import { extname } from "node:path";
import { logger } from "../utils/logger";
import type { CardsSyncOrchestrator } from "./cards-sync-orchestrator";

export class FsWatcherService {
  private watcher: FSWatcher | null = null;
  private debounceTimer: NodeJS.Timeout | null = null;
  private currentPath: string | null = null;
  private currentLibraryId: string | null = null;

  constructor(
    private orchestrator: CardsSyncOrchestrator,
    private debounceMs: number = 2000
  ) {}

  start(folderPath: string, libraryId: string): void {
    if (
      this.currentPath === folderPath &&
      this.currentLibraryId === libraryId &&
      this.watcher
    )
      return;
    this.stop();

    this.currentPath = folderPath;
    this.currentLibraryId = libraryId;

    this.watcher = chokidar.watch(folderPath, {
      ignoreInitial: true,
      persistent: true,
      awaitWriteFinish: {
        stabilityThreshold: 1500,
        pollInterval: 100,
      },
    });

    const schedule = (reason: string) => {
      if (!this.currentPath) return;
      const libId = this.currentLibraryId;
      if (!libId) return;
      if (this.debounceTimer) clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.debounceTimer = null;
        if (!this.currentPath || !this.currentLibraryId) return;
        logger.info(`FS watcher trigger scan (${reason})`);
        this.orchestrator.requestScan(
          "fs",
          this.currentPath,
          this.currentLibraryId
        );
      }, this.debounceMs);
    };

    const isPng = (path: string) => extname(path).toLowerCase() === ".png";

    this.watcher
      .on("add", (path) => {
        if (!isPng(path)) return;
        schedule("add");
      })
      .on("unlink", (path) => {
        if (!isPng(path)) return;
        schedule("unlink");
      })
      .on("addDir", () => schedule("addDir"))
      .on("unlinkDir", () => schedule("unlinkDir"))
      .on("error", (err) => logger.error(err, "FS watcher error"));

    logger.info(`FS watcher started: ${folderPath}`);
  }

  stop(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    if (this.watcher) {
      void this.watcher.close();
      this.watcher = null;
    }
    this.currentPath = null;
    this.currentLibraryId = null;
  }

  restart(folderPath: string | null, libraryId?: string): void {
    if (!folderPath) {
      this.stop();
      return;
    }
    if (!libraryId) {
      throw new Error(
        "FsWatcherService.restart requires libraryId when folderPath is not null"
      );
    }
    this.start(folderPath, libraryId);
  }

  getWatchedPath(): string | null {
    return this.currentPath;
  }

  getWatchedLibraryId(): string | null {
    return this.currentLibraryId;
  }
}
