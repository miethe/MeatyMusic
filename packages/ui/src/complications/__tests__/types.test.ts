/**
 * @jest-environment jsdom
 */

import type {
  SlotPosition,
  CardSize,
  CardState,
  ComplicationContext,
  ComplicationProps,
  ComplicationSlots,
  SlotConfig,
} from '../types';

describe('Complications Types', () => {
  describe('SlotPosition', () => {
    it('includes all expected slot positions', () => {
      const validSlots: SlotPosition[] = [
        'topLeft',
        'topRight',
        'bottomLeft',
        'bottomRight',
        'edgeLeft',
        'edgeRight',
        'footer'
      ];

      // This test validates that the type definition matches expected slots
      expect(validSlots).toHaveLength(7);
      expect(validSlots).toContain('topLeft');
      expect(validSlots).toContain('topRight');
      expect(validSlots).toContain('bottomLeft');
      expect(validSlots).toContain('bottomRight');
      expect(validSlots).toContain('edgeLeft');
      expect(validSlots).toContain('edgeRight');
      expect(validSlots).toContain('footer');
    });
  });

  describe('CardSize', () => {
    it('includes all expected card sizes', () => {
      const validSizes: CardSize[] = ['compact', 'standard', 'xl'];

      expect(validSizes).toHaveLength(3);
      expect(validSizes).toContain('compact');
      expect(validSizes).toContain('standard');
      expect(validSizes).toContain('xl');
    });
  });

  describe('CardState', () => {
    it('includes all expected card states', () => {
      const validStates: CardState[] = ['default', 'running', 'error', 'disabled', 'selected'];

      expect(validStates).toHaveLength(5);
      expect(validStates).toContain('default');
      expect(validStates).toContain('running');
      expect(validStates).toContain('error');
      expect(validStates).toContain('disabled');
      expect(validStates).toContain('selected');
    });
  });

  describe('ComplicationContext', () => {
    it('has required properties', () => {
      const context: ComplicationContext = {
        cardId: 'test-card',
        cardState: 'default',
        cardSize: 'standard',
        cardTitle: 'Test Card',
        isFocused: false,
        lastStateChange: new Date(),
        features: {
          animations: true,
          highContrast: false,
          reducedMotion: false,
        },
      };

      expect(context.cardId).toBe('test-card');
      expect(context.cardState).toBe('default');
      expect(context.cardSize).toBe('standard');
      expect(context.cardTitle).toBe('Test Card');
      expect(context.isFocused).toBe(false);
      expect(context.lastStateChange).toBeInstanceOf(Date);
      expect(context.features).toBeDefined();
      expect(context.features.animations).toBe(true);
      expect(context.features.highContrast).toBe(false);
      expect(context.features.reducedMotion).toBe(false);
    });
  });

  describe('SlotConfig', () => {
    it('accepts valid configuration', () => {
      const MockComponent = () => null;

      const config: SlotConfig = {
        component: MockComponent,
        supportedSizes: ['standard', 'xl'],
        supportedStates: ['default', 'running'],
        maxDimensions: {
          width: 48,
          height: 48,
        },
        requiresAnimations: true,
        performance: {
          lazy: false,
          memoize: true,
          priority: 100,
        },
      };

      expect(config.component).toBe(MockComponent);
      expect(config.supportedSizes).toEqual(['standard', 'xl']);
      expect(config.supportedStates).toEqual(['default', 'running']);
      expect(config.maxDimensions?.width).toBe(48);
      expect(config.maxDimensions?.height).toBe(48);
      expect(config.requiresAnimations).toBe(true);
      expect(config.performance?.lazy).toBe(false);
      expect(config.performance?.memoize).toBe(true);
      expect(config.performance?.priority).toBe(100);
    });

    it('works with minimal configuration', () => {
      const MockComponent = () => null;

      const config: SlotConfig = {
        component: MockComponent,
      };

      expect(config.component).toBe(MockComponent);
      expect(config.supportedSizes).toBeUndefined();
      expect(config.supportedStates).toBeUndefined();
      expect(config.maxDimensions).toBeUndefined();
      expect(config.requiresAnimations).toBeUndefined();
      expect(config.performance).toBeUndefined();
    });
  });

  describe('ComplicationSlots', () => {
    it('accepts partial slot mappings', () => {
      const MockComponent = () => null;

      const slots: ComplicationSlots = {
        topLeft: { component: MockComponent },
        footer: { component: MockComponent },
        // Other slots omitted
      };

      expect(slots.topLeft).toBeDefined();
      expect(slots.topRight).toBeUndefined();
      expect(slots.bottomLeft).toBeUndefined();
      expect(slots.bottomRight).toBeUndefined();
      expect(slots.edgeLeft).toBeUndefined();
      expect(slots.edgeRight).toBeUndefined();
      expect(slots.footer).toBeDefined();
    });

    it('accepts complete slot mappings', () => {
      const MockComponent = () => null;

      const slots: ComplicationSlots = {
        topLeft: { component: MockComponent },
        topRight: { component: MockComponent },
        bottomLeft: { component: MockComponent },
        bottomRight: { component: MockComponent },
        edgeLeft: { component: MockComponent },
        edgeRight: { component: MockComponent },
        footer: { component: MockComponent },
      };

      expect(Object.keys(slots)).toHaveLength(7);
      expect(slots.topLeft).toBeDefined();
      expect(slots.topRight).toBeDefined();
      expect(slots.bottomLeft).toBeDefined();
      expect(slots.bottomRight).toBeDefined();
      expect(slots.edgeLeft).toBeDefined();
      expect(slots.edgeRight).toBeDefined();
      expect(slots.footer).toBeDefined();
    });
  });

  describe('Type Safety', () => {
    it('enforces correct slot position values', () => {
      // This test validates TypeScript compile-time type safety
      const validPositions: SlotPosition[] = [
        'topLeft',
        'topRight',
        'bottomLeft',
        'bottomRight',
        'edgeLeft',
        'edgeRight',
        'footer'
      ];

      validPositions.forEach(position => {
        expect(typeof position).toBe('string');
      });

      // TypeScript should prevent invalid values at compile time
      // const invalid: SlotPosition = 'invalid'; // This would cause TS error
    });

    it('enforces correct card size values', () => {
      const validSizes: CardSize[] = ['compact', 'standard', 'xl'];

      validSizes.forEach(size => {
        expect(typeof size).toBe('string');
      });
    });

    it('enforces correct card state values', () => {
      const validStates: CardState[] = ['default', 'running', 'error', 'disabled', 'selected'];

      validStates.forEach(state => {
        expect(typeof state).toBe('string');
      });
    });
  });

  describe('Interface Compatibility', () => {
    it('ComplicationProps extends ComplicationContext', () => {
      const MockComponent = () => null;

      const context: ComplicationContext = {
        cardId: 'test',
        cardState: 'default',
        cardSize: 'standard',
        cardTitle: 'Test',
        isFocused: false,
        lastStateChange: new Date(),
        features: {
          animations: true,
          highContrast: false,
          reducedMotion: false,
        },
      };

      const props: ComplicationProps = {
        ...context,
        slot: 'topLeft',
        isVisible: true,
        onError: jest.fn(),
        className: 'test-class',
        'aria-label': 'Test complication',
      };

      // Should inherit all context properties
      expect(props.cardId).toBe(context.cardId);
      expect(props.cardState).toBe(context.cardState);
      expect(props.cardSize).toBe(context.cardSize);
      expect(props.cardTitle).toBe(context.cardTitle);
      expect(props.isFocused).toBe(context.isFocused);
      expect(props.features).toBe(context.features);

      // Should have additional properties
      expect(props.slot).toBe('topLeft');
      expect(props.isVisible).toBe(true);
      expect(props.onError).toBeDefined();
      expect(props.className).toBe('test-class');
      expect(props['aria-label']).toBe('Test complication');
    });
  });
});
