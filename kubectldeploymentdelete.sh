#!/bin/bash

kubectl delete -n kubernetes-dashboard deployment todo-app
kubectl delete -n kubernetes-dashboard configmap todo-app-config
kubectl delete -n kubernetes-dashboard secret todo-app-secret
kubectl delete -n kubernetes-dashboard service todo-app
kubectl delete -n kubernetes-dashboard secret regcred