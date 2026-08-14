/**
 * Profiler personnalisé pour mesurer les performances
 * À utiliser en développement pour identifier les goulets d'étranglement
 */

interface PerformanceMark {
  name: string;
  startTime: number;
  duration?: number;
  metadata?: Record<string, any>;
}

class PerformanceProfiler {
  private marks: Map<string, PerformanceMark> = new Map();
  private enabled: boolean = typeof window !== 'undefined' && process.env.NODE_ENV === 'development';

  /**
   * Marquer le début d'une opération
   */
  start(name: string, metadata?: Record<string, any>) {
    if (!this.enabled) return;

    const mark: PerformanceMark = {
      name,
      startTime: performance.now(),
      metadata,
    };

    this.marks.set(name, mark);

    if (metadata?.verbose) {
      console.log(`⏱️  [PERF] Début: ${name}`, metadata);
    }
  }

  /**
   * Marquer la fin d'une opération et calculer la durée
   */
  end(name: string): number | undefined {
    if (!this.enabled) return;

    const mark = this.marks.get(name);
    if (!mark) {
      console.warn(`⚠️  [PERF] Mark not found: ${name}`);
      return;
    }

    const duration = performance.now() - mark.startTime;
    mark.duration = duration;

    const severity = this.getSeverity(duration);
    console.log(
      `${severity} [PERF] ${name}: ${duration.toFixed(2)}ms`,
      mark.metadata ? `(${JSON.stringify(mark.metadata)})` : ''
    );

    return duration;
  }

  /**
   * Mesurer une fonction asynchrone
   */
  async measure<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    this.start(name, metadata);
    try {
      const result = await fn();
      this.end(name);
      return result;
    } catch (error) {
      console.error(`❌ [PERF] Error in ${name}:`, error);
      throw error;
    }
  }

  /**
   * Mesurer une fonction synchrone
   */
  measureSync<T>(
    name: string,
    fn: () => T,
    metadata?: Record<string, any>
  ): T {
    this.start(name, metadata);
    try {
      const result = fn();
      this.end(name);
      return result;
    } catch (error) {
      console.error(`❌ [PERF] Error in ${name}:`, error);
      throw error;
    }
  }

  /**
   * Obtenir la sévérité basée sur la durée
   */
  private getSeverity(duration: number): string {
    if (duration < 100) return '✅';
    if (duration < 500) return '⚠️ ';
    if (duration < 1000) return '🔴';
    return '🔥';
  }

  /**
   * Obtenir toutes les mesures
   */
  getReport(): Record<string, any> {
    const report: Record<string, any> = {};

    this.marks.forEach((mark) => {
      report[mark.name] = {
        duration: mark.duration,
        metadata: mark.metadata,
      };
    });

    return report;
  }

  /**
   * Afficher un résumé
   */
  summary() {
    if (!this.enabled) return;

    console.log('\n📊 === Performance Summary ===\n');

    const marks = Array.from(this.marks.values())
      .filter(m => m.duration !== undefined)
      .sort((a, b) => (b.duration || 0) - (a.duration || 0));

    let totalTime = 0;

    marks.forEach(mark => {
      const duration = mark.duration || 0;
      totalTime += duration;
      const bar = '█'.repeat(Math.ceil((duration / 500) * 20));
      console.log(
        `${mark.name.padEnd(30)} ${bar.padEnd(20)} ${duration.toFixed(2)}ms`
      );
    });

    console.log(`\nTotal: ${totalTime.toFixed(2)}ms\n`);
  }

  /**
   * Réinitialiser les marques
   */
  reset() {
    this.marks.clear();
  }
}

// Instance globale
export const profiler = typeof window !== 'undefined' ? new PerformanceProfiler() : null;

/**
 * Hook React pour mesurer les performances de rendu
 */
export function usePerformance(componentName: string) {
  if (typeof window === 'undefined' || !profiler) return;

  React.useEffect(() => {
    profiler?.start(`render-${componentName}`);

    return () => {
      profiler?.end(`render-${componentName}`);
    };
  }, [componentName]);
}

/**
 * Mesurer les Web Vitals
 */
export function measureWebVitals() {
  if (typeof window === 'undefined') return;

  // FCP - First Contentful Paint
  const fpoPerfEntry = performance.getEntriesByName('first-contentful-paint')[0];
  if (fpoPerfEntry) {
    console.log(`📊 FCP: ${fpoPerfEntry.startTime.toFixed(2)}ms`);
  }

  // LCP - Largest Contentful Paint
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log(`📊 LCP: ${lastEntry.startTime.toFixed(2)}ms`);
      });

      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      // Navigateur ne supporte pas LCP
    }
  }

  // Cumulative Layout Shift
  let cls = 0;
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            cls += (entry as any).value;
            console.log(`📊 CLS: ${cls.toFixed(4)}`);
          }
        }
      });

      observer.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      // Navigateur ne supporte pas CLS
    }
  }
}

export default profiler;
