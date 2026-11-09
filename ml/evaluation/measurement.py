"""End-to-end Assistance benchmark against a disposable, authenticated API."""
from concurrent.futures import ThreadPoolExecutor
import json
import math
import os
import time
import urllib.request
from ml.common.files import read_rows, sha256, write_new
from ml.common.http import NoRedirect


def percentile(values, fraction):
    values = sorted(values)
    return values[max(0, math.ceil(len(values) * fraction) - 1)] if values else None



def benchmark(args):
    cookie = os.environ.get('PYNEATH_BENCH_COOKIE')
    origin = os.environ.get('PYNEATH_BENCH_WEB_ORIGIN')
    csrf = os.environ.get('PYNEATH_BENCH_CSRF')
    if not cookie or not origin or not csrf:
        raise ValueError('Explicit disposable API session, CSRF token and web origin required')
    cases = list(read_rows(args.cases))
    if not 1 <= len(cases) <= 4:
        raise ValueError('Use up to four requests per pass; preserve existing 10/day account quota')
    evidence = json.loads(open(args.hardware_evidence, encoding='utf-8').read())
    required = {'hardware', 'model_load_ms', 'peak_ram_mb', 'peak_vram_mb', 'tokens_per_second', 'model_sha256'}
    if not required <= evidence.keys():
        raise ValueError('Missing measured hardware/model evidence')

    def request(case):
        start = time.perf_counter()
        try:
            req = urllib.request.Request(args.api_origin.rstrip('/') + '/api/v1/me/assistance', json.dumps(case).encode(), {'Content-Type': 'application/json', 'Cookie': cookie, 'Origin': origin, 'X-XSRF-TOKEN': csrf})
            with urllib.request.build_opener(NoRedirect()).open(req, timeout=7) as response:
                result = json.loads(response.read(32768))
            status = result.get('status', 'error')
        except Exception:
            status = 'error'
        return {'elapsed_ms': (time.perf_counter() - start) * 1000, 'status': status}

    reports = {}
    for concurrency in (1, 2):
        with ThreadPoolExecutor(max_workers=concurrency) as executor:
            results = list(executor.map(request, cases))
        times = [r['elapsed_ms'] for r in results]
        reports[str(concurrency)] = {'requests': len(results), 'p50_ms': percentile(times, .5), 'p95_ms': percentile(times, .95), 'errors': sum(r['status'] != 'suggestion' for r in results)}
    write_new(args.output, {'status': 'measurement-only-small-sample', 'cases_sha256': sha256(args.cases), 'hardware': evidence, 'concurrency': reports,
                           'target_observed': all(r['errors'] == 0 and r['p95_ms'] <= 5000 for r in reports.values()),
                           'limitation': 'Small end-to-end sample under product quota; not a statistically reliable p95. Accumulate authorized disposable-account measurements before sizing.'})
