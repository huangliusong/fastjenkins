import { AppContext } from '@/src/state';
import { Build, Job, Property } from '@/src/types';
import { formatTime } from '@/src/utils';
import { sendMessage } from '@/src/utils/message';
import { MsgType } from '@/types/global';
import { DownOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { Input } from 'antd';
import { CSSProperties, useContext, useEffect, useMemo, useState } from 'react';
import Favor from './Favor';
const failedColor = '#cf1322';
const successColor = '#389e0d';

interface JobItemProps {
  data: Job;
}

function JobItem(props: JobItemProps) {
  const name = props.data.name;
  const lastBuild: Build | null = props.data.lastBuild;
  const { state, dispatch } = useContext(AppContext);
  const stageInit = {
    name: '请等候...',
    percent: 0,
    status: 'IN_PROGRESS',
    durationMillis: '',
  };
  const [stage, setStage] = useState(stageInit);
  const isSelfBuilding = useMemo(() => {
    return state.building === name;
  }, [state.building]);

  const canBuilding = useMemo(() => {
    return state.building === '';
  }, [state.building]);

  useEffect(() => {
    if (state.building === name) {
      console.log('state.building', state.building, name);
      getBuildStatus();
    }
  }, [state.building]);

  const [collapse, setCollapse] = useState(true);
  const [properties, setProperties] = useState<Property[]>(props.data.properties);

  const inputChange = (index: number, event: any) => {
    const {
      target: { value },
    } = event;
    setProperties((properties: Property[]) => {
      properties[index].value = value;
      return [...properties];
    });
  };

  const toggleCollapse = () => {
    if (isSelfBuilding) {
      return;
    }
    setCollapse(!collapse);
  };

  const getBuildStatus = () => {
    const params: any = {};
    const startTime = new Date().getTime();
    const interval = setInterval(() => {
      params._ = new Date().getTime();
      sendMessage(MsgType.BuildStatus, { jobName: name, params }).then((res: any) => {
        res = res.data;
        console.log(res);
        params.since = res.name;
        const isNewBuild = res.id !== lastBuild?.id;
        if (isNewBuild) {
          const stages: any[] = res.stages;
          const lastStage = stages.length ? stages.at(-1) : stageInit;

          const estimatedDuration = lastBuild?.estimatedDuration || 60000;
          const durationMillis = res?.durationMillis || 0;
          let percent = durationMillis / estimatedDuration;
          percent = percent > 1 ? 0.99 : percent;
          lastStage.percent = percent;
          lastStage.durationMillis = (durationMillis / 1000).toFixed(1) + 's';

          if (res.status === 'SUCCESS') {
            // 刷新状态
            dispatch({
              type: 'connected',
              payload: state.connected + 1,
            });
            clearInterval(interval);
            lastStage.percent = 1;
            lastStage.name = '构建完成';
            setTimeout(() => {
              setStage({ ...stageInit });
              dispatch({
                type: 'building',
                payload: '',
              });
            }, 3000);
          }

          if (res.status === 'FAILED') {
            // 刷新状态
            dispatch({
              type: 'connected',
              payload: state.connected + 1,
            });
            clearInterval(interval);
            lastStage.percent = 1;
            lastStage.name = '构建失败';
            setTimeout(() => {
              setStage({ ...stageInit });
              dispatch({
                type: 'building',
                payload: '',
              });
            }, 3000);
          }
          setStage({ ...lastStage });
        } else {
          const stepTime = params._;
          if (stepTime - startTime > 10000) {
            // 刷新状态
            dispatch({
              type: 'connected',
              payload: state.connected + 1,
            });
            clearInterval(interval);
            dispatch({
              type: 'building',
              payload: '',
            });
          }
        }
      });
    }, 2000);
    window.onunload = () => {
      console.log(1234444444444444444);
    };
  };

  const stageBarStyle = useMemo<CSSProperties>(() => {
    const { percent, status } = stage;
    let color = '#40a9ff'; // IN_PROGRESS
    switch (status) {
      case 'SUCCESS':
        color = successColor;
        break;
      case 'FAILED':
        color = failedColor;
        break;
    }
    return {
      width: `calc(${30 + 70 * percent}% - 12px)`,
      backgroundColor: color,
      boxShadow: `0 0 4px ${color}`,
    };
  }, [stage]);

  const build = () => {
    if (!canBuilding) return;
    dispatch({
      type: 'building',
      payload: name,
      estimatedDuration: lastBuild?.estimatedDuration || 60000,
    });
    setCollapse(true);

    const params: any = {};
    properties?.forEach((property: Property) => {
      if (property.value !== '') {
        params[property.name] = property.value;
      }
    });
    sendMessage(MsgType.Build, { jobName: name, params }).then((res: Message) => {
      if (res.status !== 200) {
        dispatch({
          type: 'building',
          payload: '',
        });
      }
    });
  };

  return (
    <div react-component="JobItem">
      <div className="header" title={name}>
        <div className="title">{name}</div>
        <div className="icon" onClick={toggleCollapse}>
          {isSelfBuilding ? (
            <ThunderboltOutlined className="loadingThunder" />
          ) : (
            <DownOutlined style={{ transform: collapse ? 'rotateX(0deg)' : 'rotateX(180deg)' }} />
          )}
        </div>
      </div>
      <div className="collapseSection" style={{ height: collapse ? '0px' : 20 + 64 * properties?.length + 'px' }}>
        <div style={{ padding: '10px' }}>
          {properties.map((_p: Property, index: number) => {
            return (
              <div className="property" key={index}>
                <div className="name">{_p.name}</div>
                <Input value={_p.value} onChange={(event) => inputChange(index, event)} />
                <div className="desc">{_p.description}</div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="operation">
        <div className="lastBuild">
          {lastBuild ? (
            <>
              <div
                className="tag"
                style={{ backgroundColor: lastBuild?.result === 'SUCCESS' ? successColor : failedColor }}
              >
                #{lastBuild?.id}
              </div>
              <div className="tag">{formatTime(lastBuild?.timestamp, '{y}-{m}-{d}')}</div>
            </>
          ) : (
            <div className="tag">暂无构建</div>
          )}
        </div>

        <div className="favor">
          <Favor name={name} />
        </div>
        <div className={`buildBar ${isSelfBuilding ? 'build' : ''} ${canBuilding ? '' : 'disabled'}`}>
          {isSelfBuilding ? (
            <div className="stageBar" style={stageBarStyle}>
              <div className="name">{stage.name}</div>
              {/* <div>{(stage.percent * 100).toFixed(1)}%</div> */}
              <div>{stage.durationMillis}</div>
            </div>
          ) : (
            <div className={`buildBtn ${canBuilding ? '' : 'disabled'}`} onClick={build}>
              {canBuilding ? '开始构建' : '等待...'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default JobItem;
