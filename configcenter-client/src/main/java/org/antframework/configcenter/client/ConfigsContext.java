/* 
 * 作者：钟勋 (e-mail:zhongxunking@163.com)
 */

/*
 * 修订记录:
 * @author 钟勋 2017-09-11 14:53 创建
 */
package org.antframework.configcenter.client;

import org.antframework.common.util.other.Cache;
import org.antframework.configcenter.client.support.RefreshTrigger;
import org.antframework.configcenter.client.support.ServerRequester;
import org.antframework.configcenter.client.support.TaskExecutor;
import org.apache.commons.lang3.StringUtils;

import java.io.File;
import java.util.Collections;
import java.util.Set;
import java.util.function.Function;

/**
 * 配置上下文
 */
public class ConfigsContext {
    // config缓存
    private final Cache<String, Config> configsCache = new Cache<>(new Function<String, Config>() {
        @Override
        public Config apply(String appId) {
            Config config = new Config(appId, serverRequester, cacheDirPath);
            if (refreshTrigger != null) {
                refreshTrigger.addApp(appId);
            }
            return config;
        }
    });
    // 任务执行器
    private final TaskExecutor taskExecutor = new TaskExecutor();
    // 服务端请求器
    private final ServerRequester serverRequester;
    // 环境id
    private final String profileId;
    // 缓存文件夹路径（null表示不使用缓存文件功能）
    private final String cacheDirPath;
    // 刷新触发器
    private RefreshTrigger refreshTrigger;

    /**
     * 构造配置上下文
     *
     * @param serverUrl    服务端地址
     * @param mainAppId    主体应用id
     * @param profileId    环境id
     * @param cacheDirPath 缓存文件夹路径（null表示不使用缓存文件功能（既不读取缓存文件中的配置，也不写配置到缓存文件））
     */
    public ConfigsContext(String serverUrl, String mainAppId, String profileId, String cacheDirPath) {
        if (StringUtils.isBlank(serverUrl) || StringUtils.isBlank(mainAppId) || StringUtils.isBlank(profileId)) {
            throw new IllegalArgumentException(String.format("初始化配置中客户端的参数不合法：serverUrl=%s,mainAppId=%s,profileId=%s,cacheDirPath=%s", serverUrl, mainAppId, profileId, cacheDirPath));
        }
        serverRequester = new ServerRequester(serverUrl, mainAppId, profileId);
        this.profileId = profileId;
        this.cacheDirPath = cacheDirPath == null ? null : cacheDirPath + File.separator + mainAppId + File.separator + profileId;
    }

    /**
     * 获取配置
     *
     * @param appId 被查询配置的应用id
     * @return 指定应用的配置
     */
    public Config getConfig(String appId) {
        return configsCache.get(appId);
    }

    /**
     * 开始监听配置变更事件
     */
    public synchronized void listenConfigs() {
        if (refreshTrigger != null) {
            return;
        }
        refreshTrigger = new RefreshTrigger(profileId, serverRequester, this::refreshConfig, cacheDirPath);
        for (String appId : getAppIds()) {
            refreshTrigger.addApp(appId);
        }
    }

    /**
     * 刷新配置和zookeeper链接（异步）
     */
    public void refresh() {
        for (String appId : getAppIds()) {
            refreshConfig(appId);
            if (refreshTrigger != null) {
                refreshTrigger.addApp(appId);
            }
        }
        if (refreshTrigger != null) {
            taskExecutor.execute(new TaskExecutor.Task<RefreshTrigger>(refreshTrigger) {
                @Override
                protected void doRun(RefreshTrigger target) {
                    target.refreshZk();
                }
            });
        }
    }

    /**
     * 获取查找过配置的应用id
     */
    public Set<String> getAppIds() {
        return Collections.unmodifiableSet(configsCache.getAllKeys());
    }

    /**
     * 关闭（释放相关资源）
     */
    public synchronized void close() {
        if (refreshTrigger != null) {
            refreshTrigger.close();
        }
        taskExecutor.close();
    }

    // 刷新配置
    private void refreshConfig(String appId) {
        taskExecutor.execute(new TaskExecutor.Task<Config>(configsCache.get(appId)) {
            @Override
            protected void doRun(Config target) {
                target.refresh();
            }
        });
    }
}
