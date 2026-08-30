# Beneath Pine AI Training Workspace

Thư mục này chứa training materials tái lập được và safe public fixtures. Nó tách khỏi application runtime để model work có thể được kiểm tra mà không mở rộng quyền truy cập private data.

## Những gì thuộc về đây

| Tài liệu | Mục đích |
| --- | --- |
| [Colab setup](colab-setup.md) | Chuẩn bị môi trường training tái lập được |
| [Dataset card template](dataset-card.template.md) | Ghi nhận mục đích, thành phần và giới hạn dataset |
| [Local synthetic dataset card](dataset-card.local-synthetic-v0.md) | Mô tả synthetic fixture đã commit |
| [Multilingual-source datasheet](datasheet-multilingual-sources.md) | Ghi nhận source-research boundaries và provenance |
| [Model-card template](model-card.template.md) | Ghi nhận model đã đánh giá và release evidence |

## Ranh giới private data

Reviewed 600-scenario dataset nằm trong `ml/data/private/` và bị loại khỏi Git. Trước mỗi split hoặc training run, chạy:

```sh
python ml/scripts/validate_dataset.py <private-jsonl>
```

Chỉ ghi dataset SHA-256 và aggregate counts vào model card. Không commit raw private examples, personal data, transcripts hoặc unreviewed external-source content.

Với AI behavior và release gates ở cấp sản phẩm, dùng [Machine Learning documentation](../docs/05-machine-learning/README.md) và [AI Implementation Handbook](../docs/ai/README.md).
