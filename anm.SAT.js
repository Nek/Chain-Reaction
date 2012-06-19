// https://github.com/craftyjs/Crafty/blob/master/src/collision.js
var SAT = function (el1, el2) {
    var points1, points2, off1, off2, i, l, j, k, normal, length, min1, min2, max1, max2, interval, MTV, MTV2, MN, dot, nextPoint, currentPoint, p, m1, m2;
    points1 = el1.xdata.path.segs;
    points2 = el2.xdata.path.segs;
    off1 = el1.offset();
    off2 = el2.offset();
    i = 0;
    l = points1.length;
    k = points2.length;
    normal = { x:0, y:0 };
    MTV = null;
    MTV2 = null;
    MN = null;
    m1 = anm.Element._getIMatrixOf(el1.state);
    m2 = anm.Element._getIMatrixOf(el2.state);

    off1[0] += el1.state.x;
    off1[1] += el1.state.y;

    off2[0] += el2.state.x;
    off2[1] += el2.state.y;

    var transformAndOffset = function (p, m, off) {
        p = m.transformPoint(p[0], p[1]);
//        return [p[0] + off[0], p[1] + off[1]]
//                return p;
        return [p[0] , p[1] ];
    };

    var tao1 = (function (m1, off1) {
        return function (p) {
            return transformAndOffset(p, m1, off1);
        }
    })(m1, off1);

    var tao2 = (function (m2, off2) {
        return function (p) {
            return transformAndOffset(p, m2, off2);
        }
    })(m2, off2);

    //loop through the edges of Polygon 1
    for (; i < l; i++) {
        nextPoint = tao1(points1[(i == l - 1 ? 0 : i + 1)].pts);
        currentPoint = tao1(points1[i].pts);

        //generate the normal for the current edge
        normal.x = -(nextPoint[1] - currentPoint[1]);
        normal.y = (nextPoint[0] - currentPoint[0]);

        //normalize the vector
        length = Math.sqrt(normal.x * normal.x + normal.y * normal.y);
        normal.x /= length;
        normal.y /= length;

        //default min max
        min1 = min2 = -1;
        max1 = max2 = -1;

        //project all vertices from poly1 onto axis
        for (j = 0; j < l; ++j) {
            p = tao1(points1[j].pts);
            dot = p[0] * normal.x + p[1] * normal.y;
            if (dot > max1 || max1 === -1) max1 = dot;
            if (dot < min1 || min1 === -1) min1 = dot;
        }

        //project all vertices from poly2 onto axis
        for (j = 0; j < k; ++j) {
            p = tao2(points2[j].pts);
            dot = p[0] * normal.x + p[1] * normal.y;
            if (dot > max2 || max2 === -1) max2 = dot;
            if (dot < min2 || min2 === -1) min2 = dot;
        }

        //calculate the minimum translation vector should be negative
        if (min1 < min2) {
            interval = min2 - max1;

            normal.x = -normal.x;
            normal.y = -normal.y;
        } else {
            interval = min1 - max2;
        }

        //exit early if positive
        if (interval >= 0) {
            return false;
        }

        if (MTV === null || interval > MTV) {
            MTV = interval;
            MN = { x:normal.x, y:normal.y };
        }
    }

    //loop through the edges of Polygon 2
    for (i = 0; i < k; i++) {
        nextPoint = tao2(points2[(i == k - 1 ? 0 : i + 1)].pts);
        currentPoint = tao2(points2[i].pts);

        //generate the normal for the current edge
        normal.x = -(nextPoint[1] - currentPoint[1]);
        normal.y = (nextPoint[0] - currentPoint[0]);

        //normalize the vector
        length = Math.sqrt(normal.x * normal.x + normal.y * normal.y);
        normal.x /= length;
        normal.y /= length;

        //default min max
        min1 = min2 = -1;
        max1 = max2 = -1;

        //project all vertices from poly1 onto axis
        for (j = 0; j < l; ++j) {
            p = tao1(points1[j].pts);
            dot = p[0] * normal.x + p[1] * normal.y;
            if (dot > max1 || max1 === -1) max1 = dot;
            if (dot < min1 || min1 === -1) min1 = dot;
        }

        //project all vertices from poly2 onto axis
        for (j = 0; j < k; ++j) {
            p = tao2(points2[j].pts);
            dot = p[0] * normal.x + p[1] * normal.y;
            if (dot > max2 || max2 === -1) max2 = dot;
            if (dot < min2 || min2 === -1) min2 = dot;
        }

        //calculate the minimum translation vector should be negative
        if (min1 < min2) {
            interval = min2 - max1;

            normal.x = -normal.x;
            normal.y = -normal.y;
        } else {
            interval = min1 - max2;


        }

        //exit early if positive
        if (interval >= 0) {
            return false;
        }

        if (MTV === null || interval > MTV) MTV = interval;
        if (interval > MTV2 || MTV2 === null) {
            MTV2 = interval;
            MN = { x:normal.x, y:normal.y };
        }
    }

    return { overlap:MTV2, normal:MN };
};