/* Cockpit UsageCard from cee7b395bb70d1c09652bda2139220e1e38008b3, LGPL-2.1-or-later. Its render and lifecycle are retained.
The Cockpit transport is replaced with the NorthStar simulation adapter. */
import React from "https://esm.sh/react@18.3.1";
import {createRoot} from "https://esm.sh/react-dom@18.3.1/client?deps=react@18.3.1";
import {Button,Card,CardBody,CardFooter,CardTitle,Progress,ProgressMeasureLocation,ProgressVariant,Page,PageSection,Gallery,Title,TitleSizes,Alert,Label,Masthead,MastheadMain,MastheadBrand,MastheadContent,FormSelect,FormSelectOption} from "https://esm.sh/@patternfly/react-core@6.7.0?deps=react@18.3.1,react-dom@18.3.1";
const frame=document.getElementById("simulation"),snapshot=()=>frame.contentWindow?.northstarSnapshot?.(),host=()=>{const s=snapshot();return s?.hosts.find(h=>h.id===s.selected)},action=(a,v)=>frame.contentWindow.northstarAction(a,v);
const machine_info={cpu_ram_info:async()=>({memory:100,cpus:1})};
const cockpit={gettext:s=>s,ngettext:(a,b,n)=>n===1?a:b,format:(s,...v)=>s.replace(/\$(\d+)/g,(_,i)=>v[Number(i)]),format_bytes:(n)=>[Math.round(n).toString(),"%"],hidden:false,transport:{host:"local-simulation"},addEventListener(){},removeEventListener(){},jump(){document.getElementById("metrics").scrollIntoView({behavior:"smooth"})},channel(){let timer;return {addEventListener(event,fn){if(event==="message"){const emit=()=>{const h=host();if(h)fn(null,JSON.stringify([[h.cpu*10,0,0,h.mem]]))};timer=setInterval(emit,1000);emit()}},removeEventListener(){clearInterval(timer)},close(){clearInterval(timer)}}}};
/*
 * Copyright (C) 2019 Red Hat, Inc.
 * SPDX-License-Identifier: LGPL-2.1-or-later
 */
const _ = cockpit.gettext;

const METRICS_SPEC = {
    payload: "metrics1",
    source: "internal",
    interval: 3000,
    metrics: [
        { name: "cpu.basic.user", derive: "rate" },
        { name: "cpu.basic.system", derive: "rate" },
        { name: "cpu.basic.nice", derive: "rate" },
        { name: "memory.used" },
    ]
};

export class UsageCard extends React.Component {
    constructor(props) {
        super(props);

        this.metrics_channel = null;
        this.samples = [];

        this.state = {
            memTotal: 0, // bytes
            memUsed: 0, // bytes
            memUsedText: " ",
            numCpu: 1, // number
            cpuUsed: 0, // percentage
        };

        this.onVisibilityChange = this.onVisibilityChange.bind(this);
        this.onMetricsUpdate = this.onMetricsUpdate.bind(this);
    }

    componentDidMount() {
        machine_info.cpu_ram_info()
                .then(info => this.setState({
                    memTotal: info.memory,
                    numCpu: info.cpus,
                }));
        cockpit.addEventListener("visibilitychange", this.onVisibilityChange);
        this.onVisibilityChange();
    }

    componentWillUnmount() {
        cockpit.removeEventListener("visibilitychange", this.onVisibilityChange);
    }

    onVisibilityChange() {
        if (cockpit.hidden && this.metrics_channel !== null) {
            this.metrics_channel.removeEventListener("message", this.onMetricsUpdate);
            this.metrics_channel.close();
            this.metrics_channel = null;
            return;
        }

        if (!cockpit.hidden && this.metrics_channel === null) {
            this.metrics_channel = cockpit.channel(METRICS_SPEC);
            this.metrics_channel.addEventListener("closed", (ev, error) => console.error("metrics closed:", error));
            this.metrics_channel.addEventListener("message", this.onMetricsUpdate);
        }
    }

    onMetricsUpdate(event, message) {
        const data = JSON.parse(message);

        // reset state on meta messages
        if (!Array.isArray(data)) {
            this.samples = [];
            return;
        }

        // decompress
        data.forEach(samples => {
            samples.forEach((sample, i) => {
                if (sample !== null)
                    this.samples[i] = sample;
            });
        });

        // CPU metrics are in ms/s; divide by 10 to get percentage
        if (this.samples[0] !== false) {
            const cpu = Math.round((this.samples[0] + this.samples[1] + this.samples[2]) / 10 / this.state.numCpu);
            this.setState({ cpuUsed: cpu });
        }

        let used_text;
        if (this.state.memTotal) {
            const [total_fmt, unit] = cockpit.format_bytes(this.state.memTotal, { base2: true, separate: true, precision: 2 });
            // FIXME: passing explicit unit is deprecated, redesign this
            const used_fmt = cockpit.format_bytes(this.samples[3], unit, { separate: true, precision: 2 })[0];
            used_text = cockpit.format("$0 / $1 $2", used_fmt, total_fmt, unit);
        } else {
            used_text = " ";
        }

        this.setState({ memUsed: this.samples[3], memUsedText: used_text });
    }

    render() {
        const fraction = this.state.memTotal ? this.state.memUsed / this.state.memTotal : 0;
        const cores_str = cockpit.format(cockpit.ngettext("of $0 CPU", "of $0 CPUs", this.state.numCpu), this.state.numCpu);

        return (
            <Card className="system-usage">
                <CardTitle>{_("Usage")}</CardTitle>
                <CardBody>
                    <table className="pf-v6-c-table pf-m-grid-md pf-m-compact">
                        <tbody className="pf-v6-c-table__tbody">
                            <tr className="pf-v6-c-table__tr">
                                <th className="pf-v6-c-table__th" id="system-usage-cpu-progress" scope="row">{_("CPU")}</th>
                                <td className="pf-v6-c-table__td">
                                    <Progress value={this.state.cpuUsed}
                                        className="pf-m-sm"
                                        min={0} max={100}
                                        variant={ this.state.cpuUsed > 90 ? ProgressVariant.danger : undefined }
                                        label={ this.state.cpuUsed + '%' }
                                        aria-labelledby="system-usage-cpu-progress"
                                        measureLocation={ProgressMeasureLocation.outside} />
                                </td>
                            </tr>
                            <tr className="pf-v6-c-table__tr">
                                <th className="pf-v6-c-table__th" id="system-usage-memory-progress" scope="row">{_("Memory")}</th>
                                <td className="pf-v6-c-table__td">
                                    <Progress value={this.state.memUsed}
                                        className="pf-m-sm"
                                        min={0} max={this.state.memTotal}
                                        variant={fraction > 0.9 ? ProgressVariant.danger : undefined}
                                        aria-labelledby="system-usage-memory-progress"
                                        label={Math.round(fraction*100)+"%"}
                                        measureLocation={ProgressMeasureLocation.outside} />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </CardBody>
                <CardFooter>
                    <Button isInline variant="link" component="a" onClick={ev => { ev.preventDefault(); cockpit.jump("/metrics", cockpit.transport.host) }}>
                        {_("View metrics and history")}
                    </Button>
                </CardFooter>
            </Card>
        );
    }
}

// The overview uses Cockpit's Page/PageSection/Gallery layout and actual PatternFly React components.
function Overview(){const [state,setState]=React.useState(snapshot());React.useEffect(()=>{const t=setInterval(()=>setState(snapshot()),650);return()=>clearInterval(t)},[]);if(!state)return <p>Loading local fleet… <a href="./operations.html">Open simulation controls</a></p>;const h=state.hosts.find(x=>x.id===state.selected);return <Page className="pf-m-no-sidebar" masthead={<Masthead><MastheadMain><MastheadBrand href="../../">NorthStar</MastheadBrand></MastheadMain><MastheadContent>Browser simulation · no live hosts</MastheadContent></Masthead>}>
<PageSection hasBodyWrapper={false}><Title headingLevel="h1" size={TitleSizes["3xl"]}>{h.name}</Title><p>{h.os} · {h.arch} · agent {h.agent} · {h.region}</p><FormSelect aria-label="Select host" value={h.id} onChange={(_,v)=>{action("select",v);setState(snapshot())}}>{state.hosts.map(x=><FormSelectOption key={x.id} value={x.id} label={x.name}/>)}</FormSelect></PageSection>
<PageSection hasBodyWrapper={false}><Gallery hasGutter minWidths={{default:"280px"}}><Card><CardTitle>Health</CardTitle><CardBody><Alert isInline variant={h.online?"success":"danger"} title={h.online?"Host online":"Heartbeat missed"}/><p>Agent {state.agentOn?"running":"paused"}</p></CardBody><CardFooter><Button variant="link" onClick={()=>{action("heartbeat");setState(snapshot())}}>Send heartbeat</Button><Button variant="link" onClick={()=>{action("offline");setState(snapshot())}}>Miss heartbeat</Button></CardFooter></Card><UsageCard key={h.id}/><Card><CardTitle>System information</CardTitle><CardBody><dl><dt>Host</dt><dd>{h.name}</dd><dt>Architecture</dt><dd>{h.arch}</dd><dt>Region</dt><dd>{h.region}</dd><dt>Agent version</dt><dd>{h.agent}</dd></dl></CardBody></Card><Card><CardTitle>Configuration</CardTitle><CardBody><p>Agent polling: {state.agentOn?"Enabled":"Paused"}</p><Button variant="link" onClick={()=>{action("toggle");setState(snapshot())}}>{state.agentOn?"Pause agent":"Resume agent"}</Button></CardBody></Card></Gallery></PageSection>
<PageSection id="metrics"><Card><CardTitle>Command history</CardTitle><CardBody><Button onClick={()=>{action("queue","collect_diagnostics");setState(snapshot())}}>Collect diagnostics</Button><ul>{state.commands.filter(c=>c.hostId===h.id).map(c=><li key={c.id}>{c.type} · <Label>{c.state}</Label></li>)}</ul><Button component="a" variant="link" href="./operations.html">Full command and telemetry workbench</Button></CardBody></Card></PageSection><PageSection><a href="https://github.com/yjr28/NorthStar">NorthStar source</a> · <a href="../licenses/cockpit-lgpl.txt">Cockpit LGPL license</a> · <a href="https://github.com/cockpit-project/cockpit/blob/cee7b395bb70d1c09652bda2139220e1e38008b3/pkg/systemd/overview-cards/usageCard.jsx">Upstream UsageCard</a></PageSection></Page>}
createRoot(document.getElementById("overview")).render(<Overview/>);