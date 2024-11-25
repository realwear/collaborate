#!/bin/bash

nx run-many --target lint --all

nx test uxlib --coverage --coverageReporters lcov