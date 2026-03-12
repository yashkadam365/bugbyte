declare module "react-cytoscapejs" {
    import cytoscape from "cytoscape";
    import { Component, CSSProperties } from "react";

    interface CytoscapeComponentProps {
        elements: cytoscape.ElementDefinition[];
        stylesheet?: cytoscape.Stylesheet[];
        layout?: cytoscape.LayoutOptions;
        style?: CSSProperties;
        cy?: (cy: cytoscape.Core) => void;
        userZoomingEnabled?: boolean;
        userPanningEnabled?: boolean;
        boxSelectionEnabled?: boolean;
        autoungrabify?: boolean;
        autounselectify?: boolean;
        [key: string]: any;
    }

    export default class CytoscapeComponent extends Component<CytoscapeComponentProps> { }
}

declare module "vis-timeline/standalone" {
    export class Timeline {
        constructor(container: HTMLElement, items: any, options?: any);
        fit(): void;
        destroy(): void;
        setGroups(groups: any): void;
    }
    export class DataSet<T = any> {
        constructor(items?: T[]);
        add(item: T | T[]): void;
        remove(id: string | number): void;
    }
}

// Styled JSX declaration
declare module "react" {
    interface StyleHTMLAttributes<T> extends React.HTMLAttributes<T> {
        jsx?: boolean;
        global?: boolean;
    }
}
