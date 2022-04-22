import { AppContext } from '@/src/state';
import { sendMessage } from '@/src/utils/message';
import { Button, Switch } from 'antd';
import { MsgType } from '@/types';
import { useCallback, useContext, useEffect, useState } from 'react';

import '../style.less';
import { LinkOutlined, SettingFilled } from '@ant-design/icons';
function Connector() {
  const { state, dispatch } = useContext(AppContext);

  // 连接状态
  const [status, setStatus] = useState(0); // 0 未连接 1 连接成功 2 连接失败

  // 显示设置弹窗
  const [modalShow, setModalShow] = useState(false);

  const toggleModal = () => {
    setModalShow(!modalShow);
  };

  const [userInfo, setUserInfo] = useState({
    userName: '',
    userId: '',
    email: '',
  });

  // 连接服务器（获取用户信息、设置连接状态）
  const connect = useCallback(() => {
    sendMessage(MsgType.Connect).then((res) => {
      if (res.status === 200) {
        setStatus(1);
        setUserInfo(res.data);
        dispatch({
          type: 'userInfo',
          payload: res.data,
        });
        // 刷新Jobs
        dispatch({
          type: 'connected',
          payload: state.connected + 1,
        });
      } else {
        setStatus(2);
        dispatch({
          type: 'connected',
          payload: 0,
        });
      }
    });
  }, []);

  // 初始化时自动连接
  useEffect(connect, []);

  // 切换隐藏备注
  const toggleAliasHidden = (hidden: boolean) => {
    dispatch({
      type: 'settings',
      payload: ['aliasHidden', hidden],
    });
  };

  // 切换显示配置属性
  const togglePropertiesSwitchShow = (show: boolean) => {
    dispatch({
      type: 'settings',
      payload: ['propertiesSwitchShow', show],
    });
  };

  function getInfo() {
    switch (status) {
      case 0:
        return <div>连接中...</div>;
      case 1:
        return (
          <div className="info">
            <div className="success">
              <LinkOutlined />
              <div style={{ marginLeft: '4px' }}>连接成功!</div>
            </div>
            <div>欢迎: {userInfo.userName}</div>
          </div>
        );
      case 2:
        return (
          <div className="info">
            <div className="failed">连接失败! </div>
            请检查配置和网络
            <Button size="small" type="link" onClick={connect}>
              重新连接
            </Button>
          </div>
        );
    }
  }
  return (
    <div react-component="Connector">
      <div className="blank"></div>
      <div className="connectBar">
        {getInfo()}
        {status === 1 && <SettingFilled className="icon" onClick={toggleModal} />}
      </div>
      <div className={`settingModal ${modalShow ? 'show' : ''}`}>
        <div className="setItem">
          <div>隐藏备注</div>
          <Switch onChange={toggleAliasHidden} size="small" />
        </div>
        <div className="setItem">
          <div>配置隐藏属性</div>
          <Switch onChange={togglePropertiesSwitchShow} size="small" />
        </div>
      </div>
      <div className={`mask ${modalShow ? 'show' : ''}`} onClick={toggleModal}></div>
    </div>
  );
}

export default Connector;
