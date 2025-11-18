"""{SKILL_NAME} skill: {ONE_SENTENCE_PURPOSE}.

This skill {DESCRIPTION_OF_WHAT_IT_DOES}.

Contract: .claude/skills/workflow/{skill_name}/SKILL.md
"""

from typing import Any, Dict

import structlog

from app.workflows.skill import WorkflowContext, compute_hash, workflow_skill

logger = structlog.get_logger(__name__)


# ============================================================================
# TODO 1: Define Input/Output Schemas (Optional but Recommended)
# ============================================================================
# from pydantic import BaseModel, Field
#
# class {SkillName}InputSchema(BaseModel):
#     """Input schema for {SKILL_NAME} skill."""
#     {field_1}: {type} = Field(..., description="{description}")
#     {field_2}: {type} = Field(..., description="{description}")
#
# class {SkillName}OutputSchema(BaseModel):
#     """Output schema for {SKILL_NAME} skill."""
#     {output_field}: {type} = Field(..., description="{description}")
#     _hash: str = Field(..., description="SHA-256 hash for provenance")


# ============================================================================
# TODO 2: Configure Skill Decorator
# ============================================================================
@workflow_skill(
    name="amcs.{skill_name}.{action}",  # e.g., "amcs.plan.generate"
    # inputs_schema={SkillName}InputSchema,  # TODO: Uncomment if using schemas
    # outputs_schema={SkillName}OutputSchema,  # TODO: Uncomment if using schemas
    deterministic=True,  # TODO: Set to False only if non-deterministic (e.g., RENDER)
)
async def run_skill(
    inputs: Dict[str, Any],
    context: WorkflowContext,
) -> Dict[str, Any]:
    """Run the AMCS skill.

    This function implements the AMCS workflow skill. It performs the required action.

    Args:
        inputs: Dictionary containing:
            - input_1: Description of input_1
            - input_2: Description of input_2
        context: Workflow context with seed and run metadata

    Returns:
        Dictionary containing:
            - output_name: Description of output_name

    Raises:
        ValueError: If an input is invalid
        SkillExecutionError: If the skill fails to execute
    """

    # ========================================================================
    # TODO 3: Extract Inputs
    # ========================================================================
    input_var_1 = inputs["input_key_1"]
    input_var_2 = inputs.get("input_key_2", None)

    logger.info(
        "amcs.skill_name.action.start",
        run_id=str(context.run_id),
        seed=context.seed,
        log_field=input_var_1 if hasattr(input_var_1, "get") else "unknown",
    )

    # ========================================================================
    # TODO 4: Determinism - Seed Random Operations
    # ========================================================================
    # CRITICAL: All random operations MUST use the context seed
    # Examples:
    #   - random.seed(context.seed)
    #   - rng = np.random.default_rng(context.seed)
    #   - LLM calls: temperature=0.2, top_p=0.9, seed=context.seed
    #
    # AVOID:
    #   - random.random() without seeding
    #   - datetime.now() or time.time()
    #   - Non-deterministic retrieval (use content hash)

    # ========================================================================
    # TODO 5: Implement Core Logic
    # ========================================================================

    # Step 1: {FIRST_MAJOR_STEP}
    # ------------------------------------------------------------------------
    # TODO: Implement step 1
    {result_1} = _step_1_implementation({input_var_1})

    # Validate step 1 results
    if not _validate_step_1({result_1}):
        raise ValueError(f"{ERROR_MESSAGE}: {result_1}")

    # Step 2: {SECOND_MAJOR_STEP}
    # ------------------------------------------------------------------------
    # TODO: Implement step 2
    {result_2} = _step_2_implementation({result_1}, seed=context.seed)

    logger.info(
        "{skill_name}.step_2.complete",
        run_id=str(context.run_id),
        {metric}={result_2}.{field},
    )

    # Step 3: {THIRD_MAJOR_STEP}
    # ------------------------------------------------------------------------
    # TODO: Implement step 3
    {result_3} = _step_3_implementation({result_2})

    # ========================================================================
    # TODO 6: Assemble Output
    # ========================================================================
    output = {
        "{output_key_1}": {result_3},
        "{output_key_2}": {result_2}.{field},
        "_hash": "",  # Will be computed after assembly
    }

    # ========================================================================
    # TODO 7: Compute Hash for Provenance
    # ========================================================================
    # CRITICAL: Always compute hash for determinism validation
    output["_hash"] = compute_hash(output)

    logger.info(
        "{skill_name}.{action}.complete",
        run_id=str(context.run_id),
        seed=context.seed,
        hash=output["_hash"][:16],  # First 16 chars for logging
        {metric}={value},
    )

    # ========================================================================
    # TODO 8: Return Output
    # ========================================================================
    return {"{result_key}": output}


# ============================================================================
# Helper Functions (Private)
# ============================================================================

def _step_1_implementation({param}: {type}) -> {return_type}:
    """Implement step 1 logic.

    Args:
        {param}: {description}

    Returns:
        {description}
    """
    # TODO: Implement step 1
    pass


def _step_2_implementation({param}: {type}, seed: int) -> {return_type}:
    """Implement step 2 logic with deterministic seeding.

    Args:
        {param}: {description}
        seed: Random seed for determinism

    Returns:
        {description}
    """
    # TODO: Implement step 2
    # IMPORTANT: Use seed for any random operations
    # Example:
    #   rng = random.Random(seed)
    #   choice = rng.choice([...])
    pass


def _step_3_implementation({param}: {type}) -> {return_type}:
    """Implement step 3 logic.

    Args:
        {param}: {description}

    Returns:
        {description}
    """
    # TODO: Implement step 3
    pass


def _validate_step_1({param}: {type}) -> bool:
    """Validate step 1 results.

    Args:
        {param}: {description}

    Returns:
        True if valid, False otherwise
    """
    # TODO: Implement validation logic
    return True


# ============================================================================
# 10-POINT DETERMINISM CHECKLIST
# ============================================================================
# Before marking this skill as complete, verify ALL of these:
#
# [ ] 1. All random operations use context.seed
# [ ] 2. No unseeded random.random(), random.choice(), etc.
# [ ] 3. No datetime.now() or time.time() calls
# [ ] 4. LLM calls (if any) use temperature ≤ 0.3, top_p ≤ 0.9, seed=context.seed
# [ ] 5. Retrieval (if any) is pinned by content hash
# [ ] 6. Output includes _hash field computed via compute_hash()
# [ ] 7. No external API calls without mocking/caching
# [ ] 8. JSON serialization uses sort_keys=True
# [ ] 9. Test with 10 identical runs, verify identical _hash
# [ ] 10. Logs include run_id, seed, and hash for traceability
#
# TESTING COMMAND:
#   pytest tests/unit/skills/test_{skill_name}.py::test_{skill_name}_determinism -v
#
# EXPECTED RESULT:
#   All 10 parameterized tests pass with identical _hash values
# ============================================================================
