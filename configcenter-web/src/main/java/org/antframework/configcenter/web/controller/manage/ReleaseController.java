/* 
 * 作者：钟勋 (e-mail:zhongxunking@163.com)
 */

/*
 * 修订记录:
 * @author 钟勋 2018-12-23 17:52 创建
 */
package org.antframework.configcenter.web.controller.manage;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import org.antframework.common.util.facade.*;
import org.antframework.common.util.tostring.ToString;
import org.antframework.configcenter.biz.util.Apps;
import org.antframework.configcenter.biz.util.Configs;
import org.antframework.configcenter.biz.util.PropertyValues;
import org.antframework.configcenter.biz.util.Releases;
import org.antframework.configcenter.facade.api.ReleaseService;
import org.antframework.configcenter.facade.info.AppInfo;
import org.antframework.configcenter.facade.info.PropertyValueInfo;
import org.antframework.configcenter.facade.info.ReleaseInfo;
import org.antframework.configcenter.facade.order.*;
import org.antframework.configcenter.facade.result.AddReleaseResult;
import org.antframework.configcenter.facade.result.FindCurrentReleaseResult;
import org.antframework.configcenter.facade.result.FindReleaseResult;
import org.antframework.configcenter.facade.result.QueryReleasesResult;
import org.antframework.configcenter.facade.vo.Property;
import org.antframework.configcenter.facade.vo.Scope;
import org.antframework.configcenter.web.common.KeyPrivileges;
import org.antframework.configcenter.web.common.ManagerApps;
import org.antframework.configcenter.web.common.Privilege;
import org.antframework.configcenter.web.common.Properties;
import org.antframework.manager.facade.enums.ManagerType;
import org.antframework.manager.facade.info.ManagerInfo;
import org.antframework.manager.web.Managers;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * 发布controller
 */
@RestController
@RequestMapping("/manage/release")
@AllArgsConstructor
public class ReleaseController {
    // 掩码后的配置value
    private static final String MASKED_VALUE = "******";

    // 发布服务
    private final ReleaseService releaseService;

    /**
     * 新增发布
     *
     * @param appId     应用id（必须）
     * @param profileId 环境id（必须）
     * @param memo      备注（可选）
     */
    @RequestMapping("/addRelease")
    public AddReleaseResult addRelease(String appId, String profileId, String memo) {
        ManagerApps.adminOrHaveApp(appId);
        ManagerInfo manager = Managers.currentManager();
        if (manager.getType() != ManagerType.ADMIN) {
            // 校验是否有敏感配置被修改
            List<PropertyValueInfo> propertyValues = PropertyValues.findAppProfilePropertyValues(appId, profileId, Scope.PRIVATE);
            List<Property> left = propertyValues.stream().map(propertyValue -> new Property(propertyValue.getKey(), propertyValue.getValue(), propertyValue.getScope())).collect(Collectors.toList());
            List<Property> right = Releases.findCurrentRelease(appId, profileId).getProperties();

            Properties.Difference difference = Properties.compare(left, right);
            Properties.onlyReadWrite(appId, difference);
        }

        AddReleaseOrder order = new AddReleaseOrder();
        order.setAppId(appId);
        order.setProfileId(profileId);
        order.setMemo(memo);

        AddReleaseResult result = releaseService.addRelease(order);
        FacadeUtils.assertSuccess(result);
        maskRelease(result.getRelease());
        return result;
    }

    /**
     * 回滚发布
     *
     * @param appId         应用id（必须）
     * @param profileId     环境id（必须）
     * @param targetVersion 回滚到的目标版本（必须）
     */
    @RequestMapping("/revertRelease")
    public EmptyResult revertRelease(String appId, String profileId, Long targetVersion) {
        ManagerApps.adminOrHaveApp(appId);
        ManagerInfo manager = Managers.currentManager();
        if (manager.getType() != ManagerType.ADMIN) {
            // 校验是否有敏感配置被修改
            ReleaseInfo targetRelease = Releases.findRelease(appId, profileId, targetVersion);
            if (targetRelease == null) {
                throw new BizException(Status.FAIL, CommonResultCode.INVALID_PARAMETER.getCode(), String.format("发布[appId=%s,profileId=%s,version=%d]不存在", appId, profileId, targetVersion));
            }
            ReleaseInfo currentRelease = Releases.findCurrentRelease(appId, profileId);

            Properties.Difference difference = Properties.compare(targetRelease.getProperties(), currentRelease.getProperties());
            Properties.onlyReadWrite(appId, difference);
        }

        RevertReleaseOrder order = new RevertReleaseOrder();
        order.setAppId(appId);
        order.setProfileId(profileId);
        order.setTargetVersion(targetVersion);

        return releaseService.revertRelease(order);
    }

    /**
     * 查找当前发布
     *
     * @param appId     应用id（必须）
     * @param profileId 环境id（必须）
     */
    @RequestMapping("/findCurrentRelease")
    public FindCurrentReleaseResult findCurrentRelease(String appId, String profileId) {
        ManagerApps.adminOrHaveApp(appId);
        FindCurrentReleaseOrder order = new FindCurrentReleaseOrder();
        order.setAppId(appId);
        order.setProfileId(profileId);

        FindCurrentReleaseResult result = releaseService.findCurrentRelease(order);
        FacadeUtils.assertSuccess(result);
        maskRelease(result.getRelease());
        return result;
    }

    /**
     * 查找发布
     *
     * @param appId     应用id（必须）
     * @param profileId 环境id（必须）
     * @param version   版本（必须）
     */
    @RequestMapping("/findRelease")
    public FindReleaseResult findRelease(String appId, String profileId, Long version) {
        ManagerApps.adminOrHaveApp(appId);
        FindReleaseOrder order = new FindReleaseOrder();
        order.setAppId(appId);
        order.setProfileId(profileId);
        order.setVersion(version);

        FindReleaseResult result = releaseService.findRelease(order);
        FacadeUtils.assertSuccess(result);
        if (result.getRelease() != null) {
            maskRelease(result.getRelease());
        }
        return result;
    }

    /**
     * 查询发布
     *
     * @param pageNo    页码（必须）
     * @param pageSize  每页大小（必须）
     * @param appId     应用id（可选）
     * @param profileId 环境id（可选）
     */
    @RequestMapping("/queryReleases")
    public QueryReleasesResult queryReleases(int pageNo, int pageSize, String appId, String profileId) {
        if (appId == null) {
            Managers.admin();
        } else {
            ManagerApps.adminOrHaveApp(appId);
        }
        QueryReleasesOrder order = new QueryReleasesOrder();
        order.setPageNo(pageNo);
        order.setPageSize(pageSize);
        order.setAppId(appId);
        order.setProfileId(profileId);

        QueryReleasesResult result = releaseService.queryReleases(order);
        FacadeUtils.assertSuccess(result);
        result.getInfos().forEach(this::maskRelease);
        return result;
    }

    /**
     * 比较两个发布的配置差异
     *
     * @param appId        应用id（必须）
     * @param profileId    环境id（必须）
     * @param leftVersion  待比较的发布版本
     * @param rightVersion 待比较的发布版本
     */
    @RequestMapping("/compareReleases")
    public CompareReleasesResult compareReleases(String appId, String profileId, Long leftVersion, Long rightVersion) {
        ManagerApps.adminOrHaveApp(appId);

        List<Property> left = Releases.findRelease(appId, profileId, leftVersion).getProperties();
        List<Property> right = Releases.findRelease(appId, profileId, rightVersion).getProperties();
        Properties.Difference difference = Properties.compare(left, right);

        CompareReleasesResult result = FacadeUtils.buildSuccess(CompareReleasesResult.class);
        result.setDifference(difference);
        return result;
    }

    /**
     * 查找应用在指定环境中继承的发布
     *
     * @param appId     应用id（必须）
     * @param profileId 环境id（必须）
     */
    @RequestMapping("/findInheritedReleases")
    public FindInheritedReleasesResult findInheritedReleases(String appId, String profileId) {
        ManagerApps.adminOrHaveApp(appId);

        FindInheritedReleasesResult result = FacadeUtils.buildSuccess(FindInheritedReleasesResult.class);
        for (AppInfo app : Apps.findInheritedApps(appId)) {
            // 获取应用在各环境的发布
            Scope scope = Objects.equals(app.getAppId(), appId) ? Scope.PRIVATE : Scope.PROTECTED;
            List<ReleaseInfo> inheritedProfileReleases = Configs.findAppSelfConfig(app.getAppId(), profileId, scope);
            FindInheritedReleasesResult.AppRelease appRelease = new FindInheritedReleasesResult.AppRelease(app, inheritedProfileReleases);
            // 掩码
            maskAppRelease(appRelease);

            result.addInheritedAppRelease(appRelease);
        }
        return result;
    }

    // 对应用在各环境的发布中的敏感配置进行掩码
    private void maskAppRelease(FindInheritedReleasesResult.AppRelease appRelease) {
        ManagerInfo manager = Managers.currentManager();
        if (manager.getType() == ManagerType.ADMIN) {
            return;
        }
        List<KeyPrivileges.AppPrivilege> appPrivileges = KeyPrivileges.findInheritedPrivileges(appRelease.getApp().getAppId());
        for (ReleaseInfo release : appRelease.getInheritedProfileReleases()) {
            mask(release, appPrivileges);
        }
    }

    // 对发布中敏感配置进行掩码
    private void maskRelease(ReleaseInfo release) {
        ManagerInfo manager = Managers.currentManager();
        if (manager.getType() == ManagerType.ADMIN) {
            return;
        }
        List<KeyPrivileges.AppPrivilege> appPrivileges = KeyPrivileges.findInheritedPrivileges(release.getAppId());
        mask(release, appPrivileges);
    }

    // 对敏感配置进行掩码
    private void mask(ReleaseInfo release, List<KeyPrivileges.AppPrivilege> inheritedAppPrivileges) {
        List<Property> properties = new ArrayList<>(release.getProperties().size());
        for (Property property : release.getProperties()) {
            Privilege privilege = KeyPrivileges.calcPrivilege(inheritedAppPrivileges, property.getKey());
            if (privilege == Privilege.NONE) {
                properties.add(new Property(property.getKey(), MASKED_VALUE, property.getScope()));
            } else {
                properties.add(property);
            }
        }
        release.setProperties(properties);
    }

    /**
     * 比较两个发布的配置差异--result
     */
    @Getter
    @Setter
    public static class CompareReleasesResult extends AbstractResult {
        // 差异
        private Properties.Difference difference;
    }

    /**
     * 查找应用在指定环境中继承的发布--result
     */
    @Getter
    public static class FindInheritedReleasesResult extends AbstractResult {
        // 由近及远继承的所用应用的发布
        private final List<AppRelease> inheritedAppReleases = new ArrayList<>();

        public void addInheritedAppRelease(AppRelease appRelease) {
            inheritedAppReleases.add(appRelease);
        }

        /**
         * 应用在各环境的发布
         */
        @AllArgsConstructor
        @Getter
        public static final class AppRelease implements Serializable {
            // 应用
            private final AppInfo app;
            // 由近及远继承的所用环境中的发布
            private final List<ReleaseInfo> inheritedProfileReleases;

            @Override
            public String toString() {
                return ToString.toString(this);
            }
        }
    }
}
