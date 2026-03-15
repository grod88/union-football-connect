import unittest

from worker.app.utils.agent_runtime import get_agent_runtime_preset


class AgentRuntimePresetsTests(unittest.TestCase):
    def test_director_uses_plan_preset(self):
        preset = get_agent_runtime_preset('director')

        self.assertEqual(preset.model, 'claude-sonnet-4-20250514')
        self.assertEqual(preset.temperature, 0.3)
        self.assertEqual(preset.max_tokens, 8192)
        self.assertEqual(preset.top_p, 0.9)

    def test_haiku_agents_use_haiku_family(self):
        analista = get_agent_runtime_preset('analista')
        garimpeiro = get_agent_runtime_preset('garimpeiro')
        critico = get_agent_runtime_preset('critico')

        self.assertEqual(analista.model, 'claude-3-5-haiku-20241022')
        self.assertEqual(garimpeiro.model, 'claude-3-5-haiku-20241022')
        self.assertEqual(critico.model, 'claude-3-5-haiku-20241022')
        self.assertEqual(analista.temperature, 0.2)
        self.assertEqual(garimpeiro.temperature, 0.5)
        self.assertEqual(critico.temperature, 0.1)

    def test_model_override_preserves_sampling(self):
        preset = get_agent_runtime_preset('produtor', model_override='claude-sonnet-override')

        self.assertEqual(preset.model, 'claude-sonnet-override')
        self.assertEqual(preset.temperature, 0.3)
        self.assertEqual(preset.top_p, 0.9)
        self.assertEqual(preset.max_tokens, 8192)


if __name__ == '__main__':
    unittest.main()