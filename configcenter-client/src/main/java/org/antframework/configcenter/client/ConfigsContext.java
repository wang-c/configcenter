/* 
 * 作者：钟勋 (e-mail:zhongxunking@163.com)
 */

/*
 * 修订记录:
 * @author 钟勋 2017-09-11 14:53 创建
 */
package org.antframework.configcenter.client;

import lombok.extern.slf4j.Slf4j;
import org.antframework.common.util.other.Cache;
import org.antframework.configcenter.client.support.ServerListener;
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
@Slf4j
public class ConfigsContext {
    // config缓存
    private final Cache<String, Config> configsCache = new Cache<>(new Function<String, Config>() {
        @Override
        public Config apply(String appId) {
            return new Config(appId, serverRequester, cacheDirPath);
        }
    });
    // 任务执行器
    private final TaskExecutor taskExecutor = new TaskExecutor();
    // 服务端监听器
    private ServerListener serverListener = null;
    // 主体应用id
    private final String mainAppId;
    // 环境id
    private final String profileId;
    // 目标
    private final String target;
    // 服务端请求器
    private final ServerRequester serverRequester;
    // 缓存文件夹路径（null表示不使用缓存文件功能）
    private final String cacheDirPath;

    /**
     * 构造配置上下文
     *
     * @param mainAppId 主体应用id
     * @param profileId 环境id
     * @param target    目标
     * @param serverUrl 服务端地址
     * @param home      工作目录（用于存放缓存文件。null表示不使用缓存文件（既不读取缓存文件中的配置，也不写配置到缓存文件））
     */
    public ConfigsContext(String mainAppId, String profileId, String target, String serverUrl, String home) {
        if (StringUtils.isBlank(mainAppId) || StringUtils.isBlank(profileId) || StringUtils.isBlank(serverUrl)) {
            throw new IllegalArgumentException(String.format("创建configcenter客户端的参数不合法：mainAppId=%s,profileId=%s,serverUrl=%s,home=%s", mainAppId, profileId, serverUrl, home));
        }
        this.mainAppId = mainAppId;
        this.profileId = profileId;
        this.target = target;
        this.serverRequester = new ServerRequester(mainAppId, profileId, target, serverUrl);
        this.cacheDirPath = home == null ? null : home + File.separator + mainAppId + File.separator + profileId;
    }

    /**
     * 获取主体应用id
     */
    public String getMainAppId() {
        return mainAppId;
    }

    /**
     * 获取环境id
     */
    public String getProfileId() {
        return profileId;
    }

    /**
     * 获取目标
     */
    public String getTarget() {
        return target;
    }

    /**
     * 获取查找过配置的应用id
     */
    public Set<String> getAppIds() {
        return Collections.unmodifiableSet(configsCache.getAllKeys());
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
     * 开始监听服务端的配置
     */
    public synchronized void listenServer() {
        if (serverListener == null) {
            serverListener = new ServerListener(configsCache, serverRequester);
        }
    }

    /**
     * 刷新配置（异步）
     */
    public void refresh() {
        for (String appId : getAppIds()) {
            taskExecutor.execute(new TaskExecutor.Task<Config>(getConfig(appId)) {
                @Override
                public void run() {
                    try {
                        target.refresh();
                    } catch (Throwable e) {
                        log.error("刷新configcenter配置[mainAppId={},queriedAppId={},profileId={}]出错：{}", mainAppId, target.getAppId(), profileId, e.toString());
                    }
                }
            });
        }
    }

    /**
     * 关闭
     */
    public synchronized void close() {
        if (serverListener != null) {
            serverListener.close();
        }
        taskExecutor.close();
    }
}
