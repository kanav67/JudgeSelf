#include "testlib.h"
#include <string>
#include <set>
#include <algorithm>

using namespace std;

const int MAX_T = 10;
const int MAX_NM = 1'000'000;//2 * 1e6
const int MAX_N = 1000;
const int MAX_M = 1000;
const int MAX_Q = 10000;//1e9
const int MAX_W = 1000'000'000;//1e9
const int MAX_AI_SUM = 10;      // Sum of ai ≤ 10 per test case

int main(int argc, char** argv) {
    registerValidation(argc, argv);

    int t = inf.readInt(1, MAX_T, "t");
    inf.readEoln();
    
    long long total_nm = 0;
    
    for (int test = 0; test < t; ++test) {
        setTestCase(test);

        int n = inf.readInt(2, MAX_N, "n");
        inf.readSpace();
        int m = inf.readInt(1, MAX_M, "m");
        inf.readSpace();
        int q = inf.readInt(1, MAX_Q, "q");
        inf.readEoln();
        
        total_nm += 1ll * n * m;
        
        ensuref(total_nm <= MAX_NM, "exceeds sum of n*m over all testcase. Val: %d", total_nm);

        ensuref(1LL * n * (n-1) / 2 >= m, "number of edges should be less than max edges (n*(n-1)/2)", MAX_NM);

        //ensuref(1LL * n * m <= MAX_NM, "n * m must be ≤ %d", MAX_NM);

        set<pair<int, int>> edge_set;

        for (int i = 0; i < m; ++i) {
            int u = inf.readInt(1, n, "u");
            inf.readSpace();
            int v = inf.readInt(1, n, "v");
            inf.readSpace();
            int w = inf.readInt(1, MAX_W, "w");
            inf.readEoln();

            ensuref(u != v, "Self-loops (u == v) are not allowed");

            int a = min(u, v);
            int b = max(u, v);
            ensuref(edge_set.count({a, b}) == 0, "Duplicate edge between %d and %d", a, b);
            edge_set.insert({a, b});
        }

        string status = inf.readToken("[.x]{" + to_string(n) + "}", "status string");
        inf.readEoln();

        int ai_sum = 0;

        for (int i = 0; i < q; ++i) {
            int ai = inf.readInt(0, 1, "a_i");
            inf.readSpace();
            int xi = inf.readInt(1, n, "x_i");
            if(ai == 0){
                inf.readSpace();
                int yi = inf.readInt(1, n, "y_i");
            }
            inf.readEoln();

            ai_sum += ai;
        }

        ensuref(ai_sum <= MAX_AI_SUM, "Sum of ai in test case %d exceeds %d", test + 1, MAX_AI_SUM);
    }

    inf.readEof();
    return 0;
}
