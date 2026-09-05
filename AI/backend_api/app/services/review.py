from copy import deepcopy

from app.pipeline.templates import normalize_article_id
from app.schemas import ArticleSelection


class MissingReviewSelectionsError(ValueError):
    def __init__(self, missing_article_ids: list[str]):
        self.missing_article_ids = missing_article_ids
        super().__init__("Selections are required for all flagged articles.")


def apply_review_selections(document: dict, selections: list[ArticleSelection]) -> dict:
    updated = deepcopy(document)
    selection_by_id = {selection.article_id: selection.chosen_field for selection in selections}
    selection_by_number = {
        normalize_article_id(selection.article_id): selection.chosen_field
        for selection in selections
        if normalize_article_id(selection.article_id) is not None
    }

    missing = []

    for article in updated.get("articles", []):
        article_id = str(article.get("id", ""))
        article_number = normalize_article_id(article_id)
        chosen_field = selection_by_id.get(article_id)
        if chosen_field is None and article_number is not None:
            chosen_field = selection_by_number.get(article_number)

        if article.get("flagged_for_review") and chosen_field is None:
            missing.append(article_id)
            continue

        if chosen_field is not None:
            article["value"] = article.get(chosen_field, "")

        article.pop("value_ocr", None)
        article["flagged_for_review"] = False

    if missing:
        raise MissingReviewSelectionsError(missing)

    return updated
