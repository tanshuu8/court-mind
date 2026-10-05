from typing import Any, Dict, List, Optional


class DelayRiskExplainer:
    """SHAP (SHapley Additive exPlanations) interpretability wrapper.

    Extracts both global feature importance and individual sample-level
    explanations for court delay risk predictions.
    """

    def __init__(self, model: Optional[Any] = None) -> None:
        self.model = model
        self.explainer = None

    def fit_explainer(self, background_dataset: Any) -> None:
        """Initializes shap.TreeExplainer on the trained XGBoost model.

        TODO:
            1. Wrap trained XGBoost model with shap.TreeExplainer.
            2. Compute base expected value across classes.
        """
        raise NotImplementedError("DelayRiskExplainer.fit_explainer() will be implemented in Phase 2.")

    def explain_instance(self, sample_features: Any) -> Dict[str, Any]:
        """Computes local SHAP values for an individual court case.

        Returns:
            Dictionary containing feature attributions and base values.

        TODO:
            1. Calculate SHAP values for the given instance.
            2. Extract top positive and negative contributing factors.
            3. Return serializable payload for frontend explanation visualizations.
        """
        raise NotImplementedError("DelayRiskExplainer.explain_instance() will be implemented in Phase 2.")

    def get_global_importance(self, X_sample: Any) -> List[Dict[str, Any]]:
        """Calculates global mean absolute SHAP values across the dataset.

        TODO:
            1. Compute mean(|SHAP|) across feature dimensions.
            2. Rank features by global impact on delay risk.
        """
        raise NotImplementedError("DelayRiskExplainer.get_global_importance() will be implemented in Phase 2.")
