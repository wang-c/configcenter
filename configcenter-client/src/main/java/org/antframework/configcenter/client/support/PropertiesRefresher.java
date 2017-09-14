/* 
 * 作者：钟勋 (e-mail:zhongxunking@163.com)
 */

/*
 * 修订记录:
 * @author 钟勋 2017-09-13 10:24 创建
 */
package org.antframework.configcenter.client.support;

import org.antframework.configcenter.client.ConfigContext;
import org.antframework.configcenter.client.core.ConfigurableConfigProperties;
import org.antframework.configcenter.client.core.ModifiedProperty;
import org.apache.commons.lang3.exception.ExceptionUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Map;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;

/**
 * 属性刷新器
 */
public class PropertiesRefresher {
    private static final Logger logger = LoggerFactory.getLogger(PropertiesRefresher.class);
    // 刷新属性
    private static final Object REFRESH_ELEMENT = new Object();
    // 停止监听
    private static final Object STOP_ELEMENT = new Object();

    // 属性
    private ConfigurableConfigProperties properties;
    // 监听器注册器
    private ListenerRegistrar listenerRegistrar;
    // 服务端查询器
    private ServerQuerier serverQuerier;
    // 缓存文件处理器
    private CacheFileHandler cacheFileHandler;
    // 用于刷新的线程
    private RefreshThread refreshThread;
    // 触发更新的队列
    private BlockingQueue queue = new LinkedBlockingQueue();

    public PropertiesRefresher(ConfigurableConfigProperties properties, ListenerRegistrar listenerRegistrar, ConfigContext.InitParams initParams) {
        this.properties = properties;
        this.listenerRegistrar = listenerRegistrar;
        this.serverQuerier = new ServerQuerier(initParams);
        this.cacheFileHandler = new CacheFileHandler(initParams);
        this.refreshThread = new RefreshThread();
        this.refreshThread.start();
    }

    /**
     * 刷新配置
     */
    public void refresh() {
        try {
            if (!queue.contains(REFRESH_ELEMENT)) {
                queue.put(REFRESH_ELEMENT);
            }
        } catch (InterruptedException e) {
            ExceptionUtils.wrapAndThrow(e);
        }
    }

    /**
     * 关闭（释放相关资源）
     */
    public void close() {
        try {
            serverQuerier.close();
            queue.put(STOP_ELEMENT);
        } catch (InterruptedException e) {
            logger.error("关闭刷新线程失败");
        }
    }

    /**
     * 初始化属性
     * （先从服务端读取配置，如果失败则尝试从本地缓存文件读取配置）
     */
    public void initProperties() {
        Map<String, String> newProperties;
        boolean fromServer = true;
        try {
            newProperties = serverQuerier.queryProperties();
        } catch (Throwable e) {
            logger.error("从服务端读取配置失败：{}", e.getMessage());
            logger.warn("尝试从缓存文件读取配置");
            fromServer = false;
            newProperties = cacheFileHandler.readProperties();
        }
        properties.replaceProperties(newProperties);
        if (fromServer) {
            cacheFileHandler.writeProperties(newProperties);
        }
    }

    // 刷新线程
    private class RefreshThread extends Thread {
        @Override
        public void run() {
            while (true) {
                try {
                    Object element = queue.take();
                    if (element == STOP_ELEMENT) {
                        break;
                    }
                    Map<String, String> newProperties = serverQuerier.queryProperties();
                    List<ModifiedProperty> modifiedProperties = properties.replaceProperties(newProperties);
                    cacheFileHandler.writeProperties(newProperties);
                    listenerRegistrar.propertiesModified(modifiedProperties);
                } catch (Throwable e) {
                    logger.error("刷新配置出错：", e);
                }
            }
        }
    }
}
