"""Canonical Assistance protocol and output validation; no training dependency."""
import json
from functools import lru_cache
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PROTOCOL_PATH = ROOT / 'ml/configs/assistance-protocol-v2.json'
CAPABILITIES = ('assisted_start', 'open_seed_draft', 'stuck_recovery')
BOUNDARY = 'Pine không thể gợi ý công việc cho tình huống này. Hãy tìm sự hỗ trợ từ một người bạn tin cậy hoặc dịch vụ chuyên môn phù hợp.'
FALLBACK = 'Chưa thể tạo gợi ý. Nội dung bạn đã nhập vẫn ở đây; bạn có thể tự viết bước tiếp theo.'


@lru_cache(maxsize=1)
def protocol():
    return json.loads(PROTOCOL_PATH.read_text(encoding='utf-8'))


def validate_output(output, capability):
    from jsonschema import Draft202012Validator
    errors = list(Draft202012Validator(protocol()['output_schema']).iter_errors(output))
    if errors or output.get('capability') != capability:
        raise ValueError('Invalid output schema/capability')
    base = {'capability', 'version', 'needsHumanSupport', 'fallback'}
    if output['needsHumanSupport'] or 'message' in output:
        if set(output) != base | {'message'} or not output['message'].strip():
            raise ValueError('Boundary/fallback must not coach')
        return 'boundary' if output['needsHumanSupport'] else 'fallback'
    if capability == 'assisted_start':
        fields = {'activationStep', 'estimatedMinutes'}
    elif capability == 'open_seed_draft':
        fields = {'openSeedDraft'}
    elif output.get('recoveryAction') == 'take_break':
        fields = {'recoveryAction', 'breakMinutes'}
        if output['fallback'] != 'take_break':
            raise ValueError('Invalid break fallback')
    else:
        fields = {'recoveryAction', 'recoveryStep'}
        if output.get('recoveryAction') not in ('smaller_step', 'different_approach') or output['fallback'] != 'manual_step':
            raise ValueError('Invalid recovery action')
    if set(output) != base | fields:
        raise ValueError('Unexpected suggestion fields')
    for key in ('activationStep', 'openSeedDraft', 'recoveryStep'):
        if key in output and not output[key].strip():
            raise ValueError('Empty suggestion')
    return 'suggestion'
