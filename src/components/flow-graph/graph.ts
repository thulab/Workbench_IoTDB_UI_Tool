import { ToolItem, EdgeView } from '@antv/x6';
import { createApp, h } from 'vue';
import Tooltip from './tooltip.vue';

const app = ref();

class TooltipTool extends ToolItem<EdgeView, TooltipToolOptions> {
  private knob!: HTMLDivElement;

  render() {
    if (!this.knob) {
      this.knob = document.createElement('div') as HTMLDivElement;
      this.knob.style.position = 'absolute';
      this.container.appendChild(this.knob);
    }
    return this;
  }

  private toggleTooltip(visible: boolean) {
    const { tooltip } = this.options;
    if (app.value) {
      app.value.unmount(this.knob);
    }
    if (visible) {
      app.value = createApp({
        setup() {
          return () =>
            h(Tooltip, {
              visible,
              content: tooltip,
            });
        },
      });
      app.value.mount(this.knob);
    }
  }

  private updatePosition(e?: MouseEvent) {
    const { style } = this.knob;
    if (e) {
      const p = this.graph.clientToGraph(e.clientX, e.clientY);
      style.display = 'block';
      style.left = `${p.x}px`;
      style.top = `${p.y}px`;
    } else {
      style.display = 'none';
      style.left = '-1000px';
      style.top = '-1000px';
    }
  }

  private onMouseEnter({ e }: { e: MouseEvent }) {
    this.updatePosition(e);
    this.toggleTooltip(true);
  }

  private onMouseLeave() {
    this.updatePosition();
    this.toggleTooltip(false);
  }

  private onMouseMove() {
    this.updatePosition();
    this.toggleTooltip(false);
  }

  delegateEvents() {
    this.cellView.on('cell:mouseenter', this.onMouseEnter, this);
    this.cellView.on('cell:mouseleave', this.onMouseLeave, this);
    this.cellView.on('cell:mousemove', this.onMouseMove, this);
    return super.delegateEvents();
  }

  protected onRemove() {
    this.cellView.off('cell:mouseenter', this.onMouseEnter, this);
    this.cellView.off('cell:mouseleave', this.onMouseLeave, this);
    this.cellView.off('cell:mousemove', this.onMouseMove, this);
  }
}

TooltipTool.config({
  tagName: 'div',
  isSVGElement: false,
});

export interface TooltipToolOptions extends ToolItem {
  tooltip?: string;
}
export default TooltipTool;
